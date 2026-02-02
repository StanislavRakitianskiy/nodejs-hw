import mongoose from 'mongoose';
import { TAGS } from '../constants/tags.js';

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      default: '',
      trim: true
    },
    tag: {
      type: String,
      enum: TAGS,
      default: 'Todo'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Text index for search over title and content
noteSchema.index({ title: 'text', content: 'text' });

export const Note = mongoose.model('Note', noteSchema);
