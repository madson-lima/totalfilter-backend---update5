// carouselRoutes.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const CarouselModel = require('../models/Carousel');

/**
 *  POST /api/carousel
 *  Adiciona uma nova imagem ao carrossel.
 *  Espera receber no body: { imageUrl: "https://..." } (ou "http://..."), 
 *  mas salvaremos apenas o caminho relativo (/uploads/arquivo.jpg).
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Faltando campo imageUrl no body.' });
    }

    // Extrai apenas o nome do arquivo da URL recebida
    // Exemplo: se imageUrl = "https://seu-dominio.com/uploads/1683213073453.jpg"
    // filename = "1683213073453.jpg"
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];

    // Monta o caminho relativo para salvar no banco
    const relativePath = `/uploads/${filename}`;

    // Busca (ou cria) o documento do carrossel
    let doc = await CarouselModel.findOne({});
    if (!doc) {
      doc = new CarouselModel({ images: [] });
    }

    // Verifica se já temos 5 imagens
    if (doc.images.length >= 5) {
      return res.status(400).json({ error: 'Limite de 5 imagens atingido.' });
    }

    // Adiciona a nova imagem ao array (caminho relativo)
    doc.images.push(relativePath);
    await doc.save();

    return res.status(200).json({
      message: 'Imagem adicionada ao carrossel com sucesso!',
      imageUrl: relativePath
    });
  } catch (error) {
    console.error('Erro ao atualizar carrossel:', error);
    return res.status(500).json({ error: 'Erro ao atualizar carrossel.' });
  }
});

/**
 *  GET /api/carousel
 *  Retorna todas as imagens do carrossel (array de caminhos relativos).
 */
router.get('/', async (req, res) => {
  try {
    const doc = await CarouselModel.findOne({});
    if (!doc || doc.images.length === 0) {
      return res.json({ images: [] });
    }
    return res.json({ images: doc.images });
  } catch (error) {
    console.error('Erro ao buscar carrossel:', error);
    return res.status(500).json({ error: 'Erro ao buscar carrossel.' });
  }
});

/**
 *  DELETE /api/carousel/:imageFile
 *  Remove a imagem (caminho relativo) do array. Exemplo: "1683213073453.jpg"
 */
router.delete('/:imageFile', verifyToken, async (req, res) => {
  try {
    const { imageFile } = req.params;
    // Exemplo: imageFile = "1683213073453.jpg"

    const doc = await CarouselModel.findOne({});
    if (!doc) {
      return res.status(404).json({ error: 'Carrossel não encontrado.' });
    }

    // Monta o caminho relativo para comparar com doc.images
    const relativePathToRemove = `/uploads/${imageFile}`;

    const index = doc.images.indexOf(relativePathToRemove);
    if (index === -1) {
      return res.status(404).json({ error: 'Imagem não encontrada no carrossel.' });
    }

    // Remove do array
    doc.images.splice(index, 1);
    await doc.save();

    return res.status(200).json({ message: 'Imagem removida do carrossel com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover imagem do carrossel:', error);
    return res.status(500).json({ error: 'Erro ao remover imagem do carrossel.' });
  }
});

module.exports = router;
