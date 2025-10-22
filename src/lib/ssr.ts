import { GetServerSidePropsContext } from 'next';
import { getSessionFromReq } from './auth';

export async function requireSession(ctx: GetServerSidePropsContext, requiredRole?: string) {
  const req: any = { headers: { cookie: ctx.req.headers.cookie || '' } };
  const s = await getSessionFromReq(req as any);
  if (!s.user) {
    return { redirect: { destination: `/login${requiredRole ? `?role=${requiredRole.toLowerCase()}` : ''}`, permanent: false } };
  }
  if (requiredRole && s.user.role.toUpperCase() !== requiredRole.toUpperCase()) {
    // redirect to their permitted dashboard with notice param
    return { redirect: { destination: `/dashboard/${s.user.role.toLowerCase()}?notice=role-mismatch`, permanent: false } };
  }
  return { props: { session: s } } as any;
}
