import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authController = {
  // Login de usuario
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar datos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario
      const user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // Verificar password
      const isValidPassword = await User.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // Crear token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.correo,
          nombre: user.nombre,
          rol: user.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      // Obtener datos del usuario sin password
      const userWithoutPassword = {
        id: user.id,
        nombre: user.nombre,
        email: user.correo,
        direccion: user.direccion,
        rol: user.rol,
        created_at: user.created_at
      };

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: userWithoutPassword,
          token
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },

  // Obtener perfil del usuario actual
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },

  // Registrar nuevo usuario
  async register(req, res) {
    try {
      const { nombre, email, password, direccion } = req.body;

      // Validar datos
      if (!nombre || !email || !password || !direccion) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya existe'
        });
      }

      // Crear usuario
      const newUser = await User.create({
        nombre,
        correo: email,
        password,
        direccion,
        rol: 'vecino'
      });

      // Crear token para el nuevo usuario
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.correo,
          nombre: newUser.nombre,
          rol: newUser.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: newUser,
          token
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },

  // Cerrar sesión (en el frontend se elimina el token)
  logout(req, res) {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  }
};
