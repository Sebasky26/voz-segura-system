interface UserPayload {
    userId: string;
    email: string;
    rol: string;
}
/**
 * Verificar token con auth-service
 */
export declare function verifyWithAuthService(req: any): Promise<UserPayload | null>;
export {};
//# sourceMappingURL=auth.d.ts.map