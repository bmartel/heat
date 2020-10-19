declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      PORT?: string;
      DB_TYPE?: string;
      DB_HOST?: string;
      DB_PORT?: string;
      DB_USERNAME?: string;
      DB_PASSWORD?: string;
      DB_NAME?: string;
    }
  }
}
export {};
