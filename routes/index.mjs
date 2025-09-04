// routes/index.mjs
import express from 'express';
import fs from 'fs/promises';

const router = express.Router();

// Función para leer archivos JSON
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Función para escribir archivos JSON
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// GET - Página principal con lista y filtros
router.get('/', async (req, res) => {
  try {
    const data = await readJSONFile(process.env.DATA_FILE || './resources/data.json');
    const departments = await readJSONFile(process.env.DEPARTMENTS_FILE || './resources/departments.json');
    const towns = await readJSONFile(process.env.TOWNS_FILE || './resources/towns.json');
    
    let filteredData = data;
    
    // Aplicar filtros si existen
    const { departamento, municipio, fecha } = req.query;
    
    if (departamento) {
      filteredData = filteredData.filter(item => item.departamento === departamento);
    }
    
    if (municipio) {
      filteredData = filteredData.filter(item => item.municipio === municipio);
    }
    
    if (fecha) {
      filteredData = filteredData.filter(item => item.fecha === fecha);
    }

    // Agregar nombres legibles
    filteredData = filteredData.map(item => {
      const dept = departments.find(d => d.code === item.departamento);
      const town = towns.find(t => t.code === item.municipio);
      
      return {
        ...item,
        departamentoNombre: dept ? dept.name : 'Desconocido',
        municipioNombre: town ? town.name : 'Desconocido'
      };
    });

    res.render('index', { 
      data: filteredData, 
      departments,
      selectedDepartment: departamento || '',
      selectedMunicipio: municipio || '',
      selectedFecha: fecha || ''
    });
  } catch (error) {
    console.error('Error:', error);
    res.render('index', { 
      data: [], 
      departments: [],
      selectedDepartment: '',
      selectedMunicipio: '',
      selectedFecha: ''
    });
  }
});

// GET - Formulario nuevo registro
router.get('/new-record', async (req, res) => {
  try {
    const departments = await readJSONFile(process.env.DEPARTMENTS_FILE || './resources/departments.json');
    res.render('add-record', { departments });
  } catch (error) {
    console.error('Error:', error);
    res.render('add-record', { departments: [] });
  }
});

// POST - Crear nuevo registro
router.post('/', async (req, res) => {
  try {
    const { fecha, departamento, municipio, descripcion } = req.body;
    
    const data = await readJSONFile(process.env.DATA_FILE || './resources/data.json');
    
    const newRecord = {
      id: data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1,
      fecha,
      departamento,
      municipio,
      descripcion
    };
    
    data.push(newRecord);
    
    const success = await writeJSONFile(process.env.DATA_FILE || './resources/data.json', data);
    
    if (success) {
      res.redirect('/');
    } else {
      res.status(500).send('Error al guardar el registro');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// DELETE - Eliminar registro
router.post('/delete/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = await readJSONFile(process.env.DATA_FILE || './resources/data.json');
    
    const filteredData = data.filter(item => item.id !== id);
    
    const success = await writeJSONFile(process.env.DATA_FILE || './resources/data.json', filteredData);
    
    if (success) {
      res.redirect('/');
    } else {
      res.status(500).send('Error al eliminar el registro');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// API - Obtener municipios por departamento (para selects dependientes)
router.get('/api/towns/:departmentCode', async (req, res) => {
  try {
    const departmentCode = req.params.departmentCode;
    const towns = await readJSONFile(process.env.TOWNS_FILE || './resources/towns.json');
    
    const filteredTowns = towns.filter(town => town.department === departmentCode);
    res.json(filteredTowns);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;