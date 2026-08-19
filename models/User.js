import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student',
  },
  name: {
    type: String,
    required: true,
  },
  geminiApiKey: {
    type: String,
  },
  geminiModel: {
    type: String,
    default: 'gemini-1.5-flash-latest'
  },
  questionCategories: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Delete the cached model to force recompilation during Next.js Hot Reload
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model('User', UserSchema);
