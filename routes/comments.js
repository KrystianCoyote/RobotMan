const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Comment = require("../models/Comment");

// @route   GET api/comments
router.get("/", async (req, res) => {
    try {
        const comments = await Comment.find().populate("author", "username role").sort({ createdAt: 1 });
        res.json(comments);
    } catch (err) {
        console.error("Error al obtener comentarios:", err);
        res.status(500).json({ msg: "Error del servidor", error: err.message });
    }
});

// @route   POST api/comments
router.post("/", auth, async (req, res) => {
    try {
        const newComment = new Comment({
            content: req.body.content,
            author: req.user.id,
            parentId: req.body.parentId || null
        });
        const comment = await newComment.save();
        const populated = await Comment.findById(comment._id).populate("author", "username role");
        res.json(populated);
    } catch (err) {
        console.error("Error al crear comentario:", err);
        res.status(500).json({ msg: "Error al crear comentario", error: err.message });
    }
});

// @route   PUT api/comments/:id
router.put("/:id", auth, async (req, res) => {
    try {
        let comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ msg: "Comentario no encontrado" });
        if (comment.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: "No autorizado" });
        }
        comment.content = req.body.content;
        await comment.save();
        res.json(comment);
    } catch (err) {
        console.error("Error al editar:", err);
        res.status(500).json({ msg: "Error al editar", error: err.message });
    }
});

// @route   DELETE api/comments/:id
router.delete("/:id", auth, async (req, res) => {
    try {
        let comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ msg: "Comentario no encontrado" });
        if (req.user.role !== "admin" && comment.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: "No autorizado" });
        }
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ msg: "Comentario eliminado" });
    } catch (err) {
        console.error("Error al eliminar:", err);
        res.status(500).json({ msg: "Error al eliminar", error: err.message });
    }
});

module.exports = router;
