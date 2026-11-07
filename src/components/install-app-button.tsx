"use client";

import { DownloadIcon, ShareIcon, SquarePlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const touchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || touchMac;
}

/**
 * Chrome, Edge y Android ofrecen su diálogo de instalación. Safari en iPhone y
 * iPad no lo tiene, así que se explica cómo añadirla a la pantalla de inicio.
 * En navegadores sin soporte (Firefox de escritorio) el botón no aparece.
 */
export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden");

  useEffect(() => {
    if (isStandalone()) return;

    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setMode("prompt");
    }
    function onInstalled() {
      setPrompt(null);
      setMode("hidden");
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // En iOS no hay evento: se decide al montar.
    const timer = window.setTimeout(() => {
      if (isIos()) setMode((current) => (current === "hidden" ? "ios" : current));
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (mode === "ios") {
      setShowIosHelp(true);
      return;
    }
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    // El evento solo se puede usar una vez.
    setPrompt(null);
    if (outcome === "accepted") setMode("hidden");
  }

  if (mode === "hidden" || (mode === "prompt" && !prompt)) return null;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={install} title="Instalar la app en este dispositivo">
        <DownloadIcon aria-hidden />
        <span className="hidden sm:inline">Instalar app</span>
        <span className="sr-only sm:hidden">Instalar app</span>
      </Button>
      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir a la pantalla de inicio</DialogTitle>
            <DialogDescription>Así tendrás Anvil Studio Tasks como una app más.</DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2">
              <span className="font-medium">1.</span>
              Pulsa el botón Compartir
              <ShareIcon className="size-4" aria-label="(icono de compartir)" />
              en la barra de Safari.
            </li>
            <li className="flex items-center gap-2">
              <span className="font-medium">2.</span>
              Elige «Añadir a pantalla de inicio»
              <SquarePlusIcon className="size-4" aria-hidden />
            </li>
            <li className="flex items-center gap-2">
              <span className="font-medium">3.</span>
              Pulsa «Añadir».
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
