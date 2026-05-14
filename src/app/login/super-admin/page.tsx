import { redirect } from 'next/navigation';

export default function SuperAdminLoginPage() {
    // Redirect to unified login page
    redirect('/login');
}