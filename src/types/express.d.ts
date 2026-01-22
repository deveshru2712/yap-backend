declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        username: string;
        email: string;
        tokenVerstion: number;
      } | null;
    }
  }
}

export {};
