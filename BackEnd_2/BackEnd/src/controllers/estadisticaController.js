const Denuncia = require('../models/Denuncia');
const Usuario = require('../models/Usuario');
const Seguimiento = require('../models/Seguimiento');

class EstadisticaController {
  // Obtener estadísticas generales
  static async getGeneral(req, res, next) {
    try {
      // Estadísticas de denuncias
      const denunciasStats = await Denuncia.getStats();
      
      // Estadísticas de usuarios
      const usuariosStats = await Usuario.getStats();
      
      // Seguimiento
      const seguimientoStats = await Seguimiento.getStats();
      
      // Denuncias recientes
      const denunciasRecientes = await Denuncia.getRecent(5);

      // Procesar datos para gráficos
      const procesarDatos = (stats) => {
        const categorias = {};
        const timeline = {};
        const estados = { pendiente: 0, en_proceso: 0, resuelta: 0 };

        stats.forEach(item => {
          // Por categoría
          if (item.categoria) {
            categorias[item.categoria] = (categorias[item.categoria] || 0) + parseInt(item.por_categoria);
          }

          // Timeline
          if (item.fecha) {
            const fecha = item.fecha.toISOString().split('T')[0];
            if (!timeline[fecha]) {
              timeline[fecha] = { fecha, denuncias: 0 };
            }
            timeline[fecha].denuncias += parseInt(item.denuncias_diarias) || 0;
          }

          // Por estado
          if (item.estado) {
            estados[item.estado] = (estados[item.estado] || 0) + 1;
          }
        });

        return {
          categorias: Object.entries(categorias).map(([nombre, cantidad]) => ({ nombre, cantidad })),
          timeline: Object.values(timeline).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
          estados: Object.entries(estados).map(([nombre, cantidad]) => ({ nombre, cantidad }))
        };
      };

      const datosProcesados = procesarDatos(denunciasStats);

      // Resumen general
      const resumen = denunciasStats.reduce((acc, item) => {
        acc.total_denuncias = (acc.total_denuncias || 0) + parseInt(item.total_denuncias) || 0;
        acc.pendientes = (acc.pendientes || 0) + parseInt(item.pendientes) || 0;
        acc.en_proceso = (acc.en_proceso || 0) + parseInt(item.en_proceso) || 0;
        acc.resueltas = (acc.resueltas || 0) + parseInt(item.resueltas) || 0;
        return acc;
      }, {});

      if (resumen.total_denuncias > 0) {
        resumen.porcentaje_resueltas = ((resumen.resueltas / resumen.total_denuncias) * 100).toFixed(2);
      } else {
        resumen.porcentaje_resueltas = 0;
      }

      res.json({
        success: true,
        data: {
          resumen,
          categorias: datosProcesados.categorias,
          timeline: datosProcesados.timeline,
          estados: datosProcesados.estados,
          usuarios: usuariosStats,
          seguimiento: seguimientoStats,
          denunciasRecientes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas por período
  static async getByPeriodo(req, res, next) {
    try {
      const { periodo } = req.params; // 'dia', 'semana', 'mes', 'ano'
      
      let query = '';
      switch (periodo) {
        case 'dia':
          query = 'DATE(fecha_creacion) = CURDATE()';
          break;
        case 'semana':
          query = 'YEARWEEK(fecha_creacion) = YEARWEEK(CURDATE())';
          break;
        case 'mes':
          query = 'YEAR(fecha_creacion) = YEAR(CURDATE()) AND MONTH(fecha_creacion) = MONTH(CURDATE())';
          break;
        case 'ano':
          query = 'YEAR(fecha_creacion) = YEAR(CURDATE())';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Período inválido. Use: dia, semana, mes, ano'
          });
      }

      // Obtener estadísticas del período
      const [stats] = await require('../config/database').execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
          SUM(CASE WHEN estado = 'resuelta' THEN 1 ELSE 0 END) as resueltas,
          categoria,
          COUNT(*) as por_categoria,
          DATE(fecha_creacion) as fecha
        FROM denuncias
        WHERE ${query}
        GROUP BY categoria, DATE(fecha_creacion)
        ORDER BY fecha DESC
      `);

      res.json({
        success: true,
        periodo,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener ranking de autoridades
  static async getRankingAutoridades(req, res, next) {
    try {
      const [ranking] = await require('../config/database').execute(`
        SELECT 
          u.id,
          u.nombre,
          u.email,
          COUNT(DISTINCT s.denuncia_id) as denuncias_atendidas,
          SUM(CASE WHEN d.estado = 'resuelta' THEN 1 ELSE 0 END) as denuncias_resueltas,
          AVG(TIMESTAMPDIFF(HOUR, d.fecha_creacion, 
              (SELECT MIN(fecha_cambio) 
               FROM seguimiento_denuncias 
               WHERE denuncia_id = d.id AND estado_nuevo = 'resuelta'))) as tiempo_promedio_resolucion
        FROM usuarios u
        LEFT JOIN seguimiento_denuncias s ON u.id = s.autoridad_id
        LEFT JOIN denuncias d ON s.denuncia_id = d.id
        WHERE u.rol = 'autoridad'
        GROUP BY u.id
        ORDER BY denuncias_resueltas DESC, denuncias_atendidas DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: ranking
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener mapa de calor de denuncias
  static async getMapaCalor(req, res, next) {
    try {
      const [puntos] = await require('../config/database').execute(`
        SELECT 
          latitud,
          longitud,
          COUNT(*) as cantidad,
          categoria,
          estado
        FROM denuncias
        WHERE latitud IS NOT NULL AND longitud IS NOT NULL
        GROUP BY ROUND(latitud, 4), ROUND(longitud, 4), categoria, estado
      `);

      res.json({
        success: true,
        data: puntos
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EstadisticaController;