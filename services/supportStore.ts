import { Platform } from "react-native";

import { firebaseConfig } from "../firebase/config";
import { getScrimPermissions } from "./accessControl";
import { getAppSettings } from "./appSettings";
import { getInstalledVersion } from "./appUpdateService";
import { getValidSession } from "./authService";
import { getWebPushDiagnostic } from "./webPushDiagnostics";

export type SupportReportStatus = "Nouveau" | "Résolu";

export type SupportReport = {
  id: string;
  message: string;
  userId: string;
  email: string;
  role: "Administrateur" | "Joueur";
  platform: string;
  version: string;
  notificationsEnabled: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  webPushDiagnostic?: string;
  createdAt: string;
  status: SupportReportStatus;
};

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/supportReports`;

function stringValue(value: unknown): FirestoreValue {
  return { stringValue: String(value ?? "") };
}

function booleanValue(value: unknown): FirestoreValue {
  return { booleanValue: value === true };
}

function readString(value?: FirestoreValue) {
  return value && "stringValue" in value ? value.stringValue : "";
}

function readBoolean(value?: FirestoreValue) {
  return Boolean(value && "booleanValue" in value && value.booleanValue);
}

async function firestoreRequest(url: string, init: RequestInit = {}) {
  const session = await getValidSession();
  if (!session) throw new Error("Tu dois être connecté pour utiliser le support.");

  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function firestoreError(response: Response, fallback: string) {
  let detail = "";
  try {
    const body = await response.json() as { error?: { message?: string; status?: string } };
    detail = body.error?.message ?? body.error?.status ?? "";
  } catch {
    // Réponse non JSON.
  }

  if (response.status === 401) return new Error("Ta session a expiré. Reconnecte-toi puis renvoie le signalement.");
  if (response.status === 403) return new Error("Firebase a refusé l’envoi. Les règles Support ne sont peut-être pas encore déployées.");
  if (response.status >= 500) return new Error("Le service Firebase est momentanément indisponible. Réessaie dans quelques instants.");
  return new Error(detail ? `${fallback} (${detail})` : fallback);
}

function reportToFields(report: SupportReport): Record<string, FirestoreValue> {
  return {
    message: stringValue(report.message),
    userId: stringValue(report.userId),
    email: stringValue(report.email),
    role: stringValue(report.role),
    platform: stringValue(report.platform),
    version: stringValue(report.version),
    notificationsEnabled: booleanValue(report.notificationsEnabled),
    reminder24h: booleanValue(report.reminder24h),
    reminder1h: booleanValue(report.reminder1h),
    webPushDiagnostic: stringValue(report.webPushDiagnostic ?? ""),
    createdAt: stringValue(report.createdAt),
    status: stringValue(report.status),
  };
}

function documentToReport(document: FirestoreDocument): SupportReport {
  const fields = document.fields ?? {};
  return {
    id: document.name.split("/").pop() ?? `${Date.now()}`,
    message: readString(fields.message),
    userId: readString(fields.userId),
    email: readString(fields.email),
    role: readString(fields.role) === "Administrateur" ? "Administrateur" : "Joueur",
    platform: readString(fields.platform),
    version: readString(fields.version),
    notificationsEnabled: readBoolean(fields.notificationsEnabled),
    reminder24h: readBoolean(fields.reminder24h),
    reminder1h: readBoolean(fields.reminder1h),
    webPushDiagnostic: readString(fields.webPushDiagnostic) || undefined,
    createdAt: readString(fields.createdAt),
    status: readString(fields.status) === "Résolu" ? "Résolu" : "Nouveau",
  };
}

export async function createSupportReport(message: string) {
  const description = message.trim();
  if (!description) throw new Error("Décris le problème avant de l’envoyer.");
  if (description.length > 1200) throw new Error("Le signalement est trop long.");

  const [session, permissions, settings, webPush] = await Promise.all([
    getValidSession(),
    getScrimPermissions(),
    getAppSettings(),
    Platform.OS === "web" ? getWebPushDiagnostic() : Promise.resolve(null),
  ]);

  if (!session) throw new Error("Tu dois être connecté pour envoyer un signalement.");

  const webPushDiagnostic = webPush
    ? [
        `Autorisation : ${webPush.permission}`,
        `Service worker : ${webPush.serviceWorker}`,
        `Abonnement : ${webPush.subscription}`,
        `Firebase : ${webPush.firebase}`,
        `PWA installée : ${webPush.installed ? "oui" : "non"}`,
        `Erreur : ${webPush.error ?? "aucune"}`,
      ].join("\n")
    : undefined;

  const report: SupportReport = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: description,
    userId: session.localId,
    email: session.email,
    role: permissions.canManage ? "Administrateur" : "Joueur",
    platform: Platform.OS,
    version: getInstalledVersion(),
    notificationsEnabled: settings.notificationsEnabled,
    reminder24h: settings.reminder24h,
    reminder1h: settings.reminder1h,
    webPushDiagnostic,
    createdAt: new Date().toISOString(),
    status: "Nouveau",
  };

  let response: Response;
  try {
    response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(report.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: reportToFields(report) }),
    });
  } catch {
    throw new Error("Aucune connexion au service Support. Vérifie Internet puis réessaie.");
  }

  if (!response.ok) throw await firestoreError(response, "Le signalement n’a pas pu être envoyé.");
  return report;
}

export async function getSupportReports() {
  const permissions = await getScrimPermissions();
  if (!permissions.canManage) return [];

  const response = await firestoreRequest(`${FIRESTORE_BASE}?pageSize=100`);
  if (!response.ok) throw await firestoreError(response, "Les signalements n’ont pas pu être chargés.");

  const data = (await response.json()) as { documents?: FirestoreDocument[] };
  return (data.documents ?? [])
    .map(documentToReport)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateSupportReportStatus(report: SupportReport, status: SupportReportStatus) {
  const permissions = await getScrimPermissions();
  if (!permissions.canManage) throw new Error("Action réservée à l’administrateur.");

  const updated = { ...report, status };
  const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(report.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: reportToFields(updated) }),
  });

  if (!response.ok) throw await firestoreError(response, "Le signalement n’a pas pu être modifié.");
  return updated;
}

export async function deleteSupportReport(reportId: string) {
  const permissions = await getScrimPermissions();
  if (!permissions.canManage) throw new Error("Action réservée à l’administrateur.");

  const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(reportId)}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw await firestoreError(response, "Le signalement n’a pas pu être supprimé.");
}
