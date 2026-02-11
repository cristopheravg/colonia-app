import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const User = {
  // Buscar usuario por email
  async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM usuarios WHERE correo = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error en findByEmail:', error);
      throw error;
    }
  },

  // Buscar usuario por ID
  async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, nombre, correo, direccion, rol, created_at FROM usuarios WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error en findById:', error);
      throw error;
    }
  },

  // Crear nuevo usuario
  async create(userData) {
    try {
      const { nombre, correo, password, direccion, rol = 'vecino' } = userData;
      
      // Encriptar password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [result] = await pool.execute(
        'INSERT INTO usuarios (nombre, correo, password, direccion, rol) VALUES (?, ?, ?, ?, ?)',
        [nombre, correo, hashedPassword, direccion, rol]
      );
      
      return { id: result.insertId, nombre, correo, direccion, rol };
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  },

  // Verificar password
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // Obtener todos los usuarios (para admin)
  async getAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, nombre, correo, direccion, rol, created_at FROM usuarios ORDER BY nombre'
      );
      return rows;
    } catch (error) {
      console.error('Error en getAll:', error);
      throw error;
    }
  },

  // Actualizar usuario
  async update(id, userData) {
    try {
      const { nombre, correo, direccion } = userData;
      const [result] = await pool.execute(
        'UPDATE usuarios SET nombre = ?, correo = ?, direccion = ? WHERE id = ?',
        [nombre, correo, direccion, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }
};
