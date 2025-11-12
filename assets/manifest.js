// /assets/manifest.js
(function () {
  // Paleta base (opcional, por si la quieres consultar desde JS)
  window.AppTheme = {
    bg: "#ccecee",
    tealLight: "#2e7c6d", // referencia aproximada por si la requieres
    teal: "#14967f",
    tealDark: "#095d7e",
    gray: "#ccecee",
    brandBlue: "#1f49ff",
    danger: "#ff5757"
  };

  // Rutas de assets (según tu estructura en GitHub)
  window.ASSETS = {
    brand: {
      logo:    "assets/brand/logo.svg",
      logoini: "assets/brand/logoini.svg",
      logofin: "assets/brand/logofin.svg",
    },
    avatars: {
      male:   "assets/avatars/avatarh.svg",
      female: "assets/avatars/avatarm.svg",
    },
    icons: {
      ui: {
        menu:     "assets/icons/ui/menu.svg",
        usuario:  "assets/icons/ui/usuario.svg",
        password: "assets/icons/ui/password.svg",
        nuevo:    "assets/icons/ui/nuevo.svg",
        editar:   "assets/icons/ui/editar.svg",
        borrar:   "assets/icons/ui/borrar.svg",
        filtro:   "assets/icons/ui/filtro.svg",
        exportar: "assets/icons/ui/exportar.svg",
        respaldo: "assets/icons/ui/respaldo.svg",
        logout:   "assets/icons/ui/logout.svg",
      },
      types: {
        bano:         "assets/icons/types/baño.svg",
        dolor:        "assets/icons/types/dolor.svg",
        lpm:          "assets/icons/types/lpm.svg",
        mareo:        "assets/icons/types/mareo.svg",
        medicamento:  "assets/icons/types/medicamento.svg",
        sangre:       "assets/icons/types/sangre.svg",
        peso:         "assets/icons/types/peso.svg",
      }
    }
  };

  // Si en algún momento quieres inyectar un placeholder de Cognito para evitar warnings:
  if (typeof window.COGNITO_CONFIG === "undefined") {
    window.COGNITO_CONFIG = null; // lo dejaremos nulo hasta que conectemos Cognito
  }
})();
