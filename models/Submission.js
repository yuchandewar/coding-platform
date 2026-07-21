import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  type: {
    type: String,
    enum: ['programming', 'quiz', 'fill_in_the_blank', 'pairing'],
    required: true,
  },
  // For quiz
  selectedOptionIndex: {
    type: Number,
  },
  // For fill_in_the_blank
  textResponse: {
    type: String,
  },
  // For pairing
  pairedResponses: [{
    left: String,
    right: String,
  }],
  // For programming
  code: {
    type: String,
  },
  language: {
    type: String,
  }
});

const SubmissionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [AnswerSchema],
  score: {
    type: Number, // Percentage 0-100 or actual score
  },
  tabSwitches: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['submitted', 'graded'],
    default: 'submitted',
  },
  timeTaken: {
    type: Number, // Time taken in seconds
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedbackText: {
    type: String,
  }
}, { timestamps: true });

if (mongoose.models.Submission) {
  delete mongoose.models.Submission;
}
export default mongoose.model('Submission', SubmissionSchema);
