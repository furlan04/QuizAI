// src/services/index.js
// File di esportazione centralizzato per tutti i servizi

// Servizi principali
export * from './AuthService';
export * from './QuizService';
export * from './QuizAttemptService';
export * from './FriendshipService';
export * from './UserService';
export * from './CommonService';
export * from './LikeService';

// Servizi di utilità
export { default as NotificationService } from './NotificationService';
export { notify, NOTIFICATION_TYPES } from './NotificationService';
