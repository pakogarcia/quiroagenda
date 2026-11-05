'use client';

import * as React from 'react';

/**
 * Guardian que asegura que document.body nunca quede bloqueado (pointer-events: none,
 * overflow: hidden o data-scroll-locked) tras cerrar cualquier modal, diálogo o alerta de Radix UI.
 */
export function PointerEventsGuardian() {
  React.useEffect(() => {
    const cleanBodyStyles = () => {
      // Comprobar si realmente hay algún diálogo o alerta abierto en el DOM
      const hasOpenModal = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-portal] [data-state="open"]'
      );

      if (!hasOpenModal) {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = '';
        }
        if (document.body.hasAttribute('data-scroll-locked')) {
          document.body.removeAttribute('data-scroll-locked');
        }

        // Limpiar aria-hidden residual en la estructura de la página
        const hiddenContainers = document.querySelectorAll(
          'main[aria-hidden="true"], header[aria-hidden="true"], div#__next[aria-hidden="true"]'
        );
        hiddenContainers.forEach((el) => el.removeAttribute('aria-hidden'));
      }
    };

    // 1. Observar cambios en los estilos y atributos del body
    const observer = new MutationObserver(() => {
      // Deferimos brevemente para respetar la animación de salida legítima
      setTimeout(cleanBodyStyles, 30);
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked', 'aria-hidden'],
    });

    // 2. Listener en fase de captura (window capture): si el usuario interactúa
    // (toca o hace clic) y el body quedó bloqueado sin haber ningún modal abierto,
    // se desbloquea en el acto para que la interacción se ejecute a la primera.
    const handleCaptureInteraction = () => {
      if (document.body.style.pointerEvents === 'none') {
        cleanBodyStyles();
      }
    };

    window.addEventListener('pointerdown', handleCaptureInteraction, { capture: true, passive: true });
    window.addEventListener('click', handleCaptureInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', handleCaptureInteraction, { capture: true, passive: true });

    // Ejecución inicial por si acaso al montar
    cleanBodyStyles();

    return () => {
      observer.disconnect();
      window.removeEventListener('pointerdown', handleCaptureInteraction, { capture: true });
      window.removeEventListener('click', handleCaptureInteraction, { capture: true });
      window.removeEventListener('touchstart', handleCaptureInteraction, { capture: true });
    };
  }, []);

  return null;
}
