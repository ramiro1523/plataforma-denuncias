// src/middlewares/validationMiddleware.js
const { body, validationResult } = require("express-validator");

// Helper para responder errores
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: "Errores de validación",
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

// ✅ Register (si lo usas)
const validateRegister = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 3 })
    .withMessage("El nombre debe tener al menos 3 caracteres"),

  body("email").trim().notEmpty().withMessage("El email es requerido").isEmail().withMessage("Email inválido"),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 4 })
    .withMessage("La contraseña debe tener al menos 4 caracteres"),

  body("rol").optional().isIn(["ciudadano", "autoridad"]).withMessage("Rol inválido"),

  handleValidationErrors,
];

// ✅ Login (si lo usas)
const validateLogin = [
  body("email").trim().notEmpty().withMessage("El email es requerido").isEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
  body("userType").optional().isIn(["ciudadano", "autoridad"]).withMessage("Tipo de usuario inválido"),
  handleValidationErrors,
];

// ✅ Denuncia (NUEVO: direccion obligatoria, lat/lng opcional)
const validateDenuncia = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("El título es requerido")
    .isLength({ min: 3 })
    .withMessage("El título debe tener al menos 3 caracteres"),

  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isLength({ min: 5 })
    .withMessage("La descripción debe tener al menos 5 caracteres"),

  body("categoria")
    .notEmpty()
    .withMessage("La categoría es requerida")
    .isIn(["bache", "alumbrado", "basura", "agua", "seguridad", "transporte", "otros"])
    .withMessage("Categoría inválida"),

  // ✅ DIRECCIÓN OBLIGATORIA
  body("direccion")
    .trim()
    .notEmpty()
    .withMessage("La dirección es requerida")
    .isLength({ min: 4 })
    .withMessage("La dirección debe tener al menos 4 caracteres"),

  // ✅ lat/lng opcional (si viene uno, debe venir el otro)
  body("latitud")
    .optional({ values: "falsy" })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitud inválida"),

  body("longitud")
    .optional({ values: "falsy" })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitud inválida"),

  // Validación cruzada: ambos o ninguno
  (req, res, next) => {
    const { latitud, longitud } = req.body;

    const latProvided = latitud !== undefined && latitud !== null && latitud !== "";
    const lngProvided = longitud !== undefined && longitud !== null && longitud !== "";

    if (latProvided !== lngProvided) {
      return res.status(400).json({
        success: false,
        message: "Errores de validación",
        errors: [
          {
            field: "coordenadas",
            message: "Si envías latitud debes enviar longitud (y viceversa).",
          },
        ],
      });
    }
    next();
  },

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateDenuncia,
  handleValidationErrors,
};
