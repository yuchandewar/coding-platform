import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['programming', 'quiz', 'fill_in_the_blank', 'pairing'],
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  negativeMarks: {
    type: Number, // Override for specific question
  },
  // For quiz type
  options: [{
    type: String,
  }],
  correctOptionIndex: {
    type: Number,
  },
  // For fill_in_the_blank type
  blankAnswers: [{
    type: String,
  }],
  // For pairing type
  pairs: [{
    left: String,
    right: String,
  }],
  // For programming type
  supportedLanguages: [{
    type: String, // e.g. 'javascript', 'python', 'cpp', 'java'
  }],
  baseCode: {
    type: Map,
    of: String, // e.g. { 'javascript': 'function solve() {}' }
  },
  driverCode: {
    type: Map,
    of: String, // e.g. { 'javascript': '{{USER_CODE}}\nconsole.log(solve("test"));' }
  },
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
  }]
});

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  timerMinutes: {
    type: Number,
    required: true,
    default: 60,
  },
  status: {
    type: String,
    enum: ['draft', 'live', 'expired'],
    default: 'draft',
  },
  allowNegativeMarking: {
    type: Boolean,
    default: false,
  },
  defaultNegativeMarks: {
    type: Number,
    default: 0,
  },
  revealScores: {
    type: Boolean,
    default: false,
  },
  allowMultipleSubmissions: {
    type: Boolean,
    default: false,
  },
  shuffleQuestions: {
    type: Boolean,
    default: false,
  },
  issueCertificate: {
    type: Boolean,
    default: false,
  },
  organizationName: {
    type: String,
    default: 'Coding Exam Platform',
  },
  eventName: {
    type: String,
    default: 'Programming Assessment',
  },
  certificateTemplate: {
    backgroundImage: String,
    elements: [{
      type: { type: String }, // e.g. 'studentName', 'score', 'date', 'rank', 'customText'
      customText: String,
      x: Number,
      y: Number,
      fontSize: Number,
      color: String,
      fontFamily: String
    }]
  },
  certificateEligibility: {
    condition: { type: String, enum: ['all', 'rank', 'score'], default: 'all' },
    threshold: { type: Number, default: 0 }
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questions: [QuestionSchema],
}, { timestamps: true });

if (mongoose.models.Test) {
  delete mongoose.models.Test;
}
export default mongoose.model('Test', TestSchema);
