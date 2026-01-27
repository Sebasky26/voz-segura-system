interface AuthServiceUser {
    userId: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: 'ADMIN' | 'SUPERVISOR' | 'USUARIO';
}
export declare const verifyWithAuthService: (req: any) => Promise<AuthServiceUser | null>;
export declare const extractUserInfoForLogging: (req: any) => {
    userId?: string;
    userAgent?: string;
    ip?: string;
};
export declare const extractUserMiddleware: (req: any, res: any, next: any) => void;
export {};
//# sourceMappingURL=auth.d.ts.map