// src/routes/denunciaRoutes.js
const express = require("express");
const router = express.Router();

const DenunciaController = require("../controllers/denunciaController");

// Importar módulos completos
const validation = require("../middlewares/validationMiddleware") || {};
const auth = require("../middlewares/authMiddleware") || {};
const uploadMw = require("../middlewares/uploadMiddleware") || {};

// -------- helpers para NO CRASHEAR ----------
const warnNoop = (name) => (req, res, next) => {
  console.warn(`⚠️  Middleware faltante/undefined: ${name} (se usó NO-OP)`);
  next();
};

function asMwList(name, maybeFnOrArray) {
  if (!maybeFnOrArray) return [warnNoop(name)];
  const list = Array.isArray(maybeFnOrArray) ? maybeFnOrArray : [maybeFnOrArray];
  const onlyFns = list.filter((x) => typeof x === "function");
  if (onlyFns.length === 0) return [warnNoop(name)];
  if (onlyFns.length !== list.length) {
    console.warn(`⚠️  ${name} tenía elementos no-función; se ignoraron.`);
  }
  return onlyFns;
}

function safeHandler(name, fn) {
  if (typeof fn === "function") return fn;
  return (req, res) => {
    console.error(`❌ Handler faltante/undefined: ${name}`);
    res.status(500).json({ success: false, message: `Handler faltante: ${name}` });
  };
}

// Middlewares (si faltan, no crashean)
const authRequired = asMwList("auth.authRequired", auth.authRequired);
const autoridadRequired = asMwList("auth.autoridadRequired", auth.autoridadRequired);
const ciudadanoRequired = asMwList("auth.ciudadanoRequired", auth.ciudadanoRequired);

const validateDenuncia = asMwList("validation.validateDenuncia", validation.validateDenuncia);
const validateEstado = asMwList("validation.validateEstado", validation.validateEstado);
const handleValidationErrors = asMwList(
  "validation.handleValidationErrors",
  validation.handleValidationErrors
);

// Upload single (si falta multer, no crashea)
const uploadSingleFoto =
  uploadMw.upload && typeof uploadMw.upload.single === "function"
    ? uploadMw.upload.single("foto")
    : warnNoop('upload.single("foto")');

const handleUploadErrors = asMwList("uploadMw.handleUploadErrors", uploadMw.handleUploadErrors);

// -------- RUTAS PÚBLICAS ----------
router.get("/search", safeHandler("DenunciaController.search", DenunciaController.search));
router.get("/", safeHandler("DenunciaController.getAll", DenunciaController.getAll));

router.get(
  "/categoria/:categoria",
  safeHandler("DenunciaController.getByCategoria", DenunciaController.getByCategoria)
);

router.get(
  "/estado/:estado",
  safeHandler("DenunciaController.getByEstado", DenunciaController.getByEstado)
);

// ✅ IMPORTANTE: esta ruta debe ir ANTES de "/:id"
router.get(
  "/usuario/mis-denuncias",
  ...authRequired,
  safeHandler("DenunciaController.getMisDenuncias", DenunciaController.getMisDenuncias)
);

router.get(
  "/:id/seguimiento",
  safeHandler("DenunciaController.getSeguimiento", DenunciaController.getSeguimiento)
);

router.get("/:id", safeHandler("DenunciaController.getById", DenunciaController.getById));

// -------- RUTAS PROTEGIDAS ----------

// Crear denuncia (solo ciudadanos)
router.post(
  "/",
  ...authRequired,
  ...ciudadanoRequired,
  uploadSingleFoto,
  ...handleUploadErrors,
  ...validateDenuncia,
  ...handleValidationErrors,
  safeHandler("DenunciaController.create", DenunciaController.create)
);

// Actualizar estado (solo autoridades) - PUT
router.put(
  "/:id/estado",
  ...authRequired,
  ...autoridadRequired,
  ...validateEstado,
  ...handleValidationErrors,
  safeHandler("DenunciaController.updateEstado", DenunciaController.updateEstado)
);

// ✅ Opción 1: también aceptar PATCH (para que tu Frontend no falle)
router.patch(
  "/:id/estado",
  ...authRequired,
  ...autoridadRequired,
  ...validateEstado,
  ...handleValidationErrors,
  safeHandler("DenunciaController.updateEstado", DenunciaController.updateEstado)
);

// Eliminar denuncia (solo ciudadano)
router.delete(
  "/:id",
  ...authRequired,
  ...ciudadanoRequired,
  safeHandler("DenunciaController.delete", DenunciaController.delete)
);

module.exports = router;
