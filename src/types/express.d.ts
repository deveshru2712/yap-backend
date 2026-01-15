declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        userName: string;
        email: string;
        tokenVerstion: number;
      } | null;
    }
  }
}

export {};
