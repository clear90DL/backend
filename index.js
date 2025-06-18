require('dotenv').config();
const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");

app.use(cors());
app.use(express.json());

// Configuración de conexión usando pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Middleware para validar datos de empleado
const validateEmployeeData = (req, res, next) => {
  const { nombre, edad, pais, cargo, anios } = req.body;
  
  if (!nombre || !edad || !pais || !cargo || !anios) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  
  if (isNaN(edad) || isNaN(anios)) {
    return res.status(400).json({ error: "Edad y años deben ser números" });
  }
  
  next();
};

// Crear empleado
app.post("/create", validateEmployeeData, (req, res) => {
  const { nombre, edad, pais, cargo, anios } = req.body;

  pool.query(
    "INSERT INTO empleados(nombre, edad, pais, cargo, anios) VALUES (?, ?, ?, ?, ?)",
    [nombre, edad, pais, cargo, anios],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al registrar empleado", details: err.message });
      }
      res.status(201).json({ 
        message: "Empleado registrado correctamente",
        id: result.insertId 
      });
    }
  );
});

// Obtener todos los empleados
app.get("/empleados", (req, res) => {
  pool.query("SELECT * FROM empleados", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al obtener empleados", details: err.message });
    }
    res.json(result);
  });
});

// Eliminar empleado por ID
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  pool.query("DELETE FROM empleados WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al eliminar empleado", details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }
    
    res.json({ message: "Empleado eliminado correctamente" });
  });
});

// Actualizar empleado
app.put("/update", validateEmployeeData, (req, res) => {
  const { id, nombre, edad, pais, cargo, anios } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  pool.query(
    "UPDATE empleados SET nombre = ?, edad = ?, pais = ?, cargo = ?, anios = ? WHERE id = ?",
    [nombre, edad, pais, cargo, anios, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar empleado", details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      
      res.json({ message: "Empleado actualizado correctamente" });
    }
  );
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo salió mal en el servidor" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
