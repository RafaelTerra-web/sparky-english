import { runNotificationCron } from '@/lib/notification-cron';
export const maxDuration=300;
export async function GET(request:Request) { return runNotificationCron(request,'review'); }
