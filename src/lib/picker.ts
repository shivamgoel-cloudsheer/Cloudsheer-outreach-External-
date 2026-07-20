"use client";

/**
 * Google Picker integration.
 *
 * Under the per-file `drive.file` scope the app can only touch spreadsheets the
 * user has explicitly handed over. The Picker is how they hand one over: the
 * user selects the file, and that grant persists for the app (including for
 * later server-side background reads/writes).
 */

type PickerDoc = { id: string };
type PickerData = { action: string; docs?: PickerDoc[] };

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

let pickerReady: Promise<void> | null = null;

/** Loads apis.google.com once and initialises the picker module. */
function loadPicker(): Promise<void> {
  if (pickerReady) return pickerReady;
  pickerReady = new Promise<void>((resolve, reject) => {
    const init = () => {
      if (!window.gapi) return reject(new Error("Google API failed to load"));
      window.gapi.load("picker", { callback: () => resolve() });
    };
    if (document.querySelector("script[data-gapi]")) return init();

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.dataset.gapi = "1";
    script.onload = init;
    script.onerror = () => reject(new Error("Could not load the Google Picker"));
    document.head.appendChild(script);
  });
  return pickerReady;
}

/** Short-lived OAuth token for the Picker (the refresh token stays server-side). */
async function getAccessToken(): Promise<string> {
  const res = await fetch("/api/google/picker-token", { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Could not get a Google access token");
  }
  return json.accessToken as string;
}

/**
 * Opens the Google Picker filtered to spreadsheets. When `preselectFileId` is
 * given the picker opens pre-navigated to that exact file, so a user who pasted
 * a link only has to confirm it.
 *
 * Resolves with the chosen spreadsheet id, or null if the user cancelled.
 */
export async function pickSpreadsheet(
  preselectFileId?: string | null
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
  if (!apiKey || !appId) {
    throw new Error(
      "Google Picker is not configured (missing NEXT_PUBLIC_GOOGLE_API_KEY or NEXT_PUBLIC_GOOGLE_APP_ID)."
    );
  }

  await loadPicker();
  const token = await getAccessToken();
  const google = window.google;

  return new Promise<string | null>((resolve) => {
    const view = new google.picker.DocsView(
      google.picker.ViewId.SPREADSHEETS
    ).setSelectFolderEnabled(false);
    // Jump straight to the sheet the user pasted (Picker setFileIds).
    if (preselectFileId) view.setFileIds(preselectFileId);

    const picker = new google.picker.PickerBuilder()
      .setTitle("Select your contact sheet")
      // Must be the Cloud project NUMBER - this is what ties the per-file
      // grant to this app. Without it the pick grants nothing.
      .setAppId(appId)
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .addView(view)
      .setCallback((data: PickerData) => {
        if (data.action === google.picker.Action.PICKED) {
          resolve(data.docs?.[0]?.id ?? null);
        } else if (data.action === google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();

    picker.setVisible(true);
  });
}
