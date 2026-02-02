import createError from 'http-errors';
import mongoose from 'mongoose';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query;
    const userId = req.user._id;

    const pageNumber = Number(page) || 1;
    const perPageNumber = Number(perPage) || 10;
    const skip = (pageNumber - 1) * perPageNumber;

    const filter = { userId };

    if (tag) {
      filter.tag = tag;
    }

    if (search !== undefined) {
      if (search.trim() !== '') {
        filter.$text = { $search: search };
      }
    }

    const [notes, totalNotes] = await Promise.all([
      Note.find(filter).skip(skip).limit(perPageNumber),
      Note.countDocuments(filter)
    ]);

    const totalPages = totalNotes === 0 ? 0 : Math.ceil(totalNotes / perPageNumber);

    res.status(200).json({
      page: pageNumber,
      perPage: perPageNumber,
      totalNotes,
      totalPages,
      notes
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw createError(404, 'Note not found');
    }

    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      throw createError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const note = await Note.create({
      ...req.body,
      userId
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw createError(404, 'Note not found');
    }

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!note) {
      throw createError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw createError(404, 'Note not found');
    }

    const note = await Note.findOneAndDelete({ _id: noteId, userId });

    if (!note) {
      throw createError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

