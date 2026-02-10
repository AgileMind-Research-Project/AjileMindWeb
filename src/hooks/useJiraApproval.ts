import { useState } from 'react';
import { toast } from 'sonner';
import { jiraApi } from '@/lib/api/jira.api';
import { TaskUpdate } from '@/lib/api/task-updates.api';

interface UseJiraApprovalProps {
    onApprove: (task: TaskUpdate) => Promise<void>;
}

export function useJiraApproval({ onApprove }: UseJiraApprovalProps) {
    const [isChecking, setIsChecking] = useState(false);

    const handleApproveWithCheck = async (task: TaskUpdate) => {
        if (!task.ticket_id) {
            toast.error("Task has no Ticket ID");
            return;
        }

        setIsChecking(true);
        const toastId = toast.loading(`Transitioning ${task.ticket_id} to Done...`);

        try {
            // Attempt to transition the issue to "Done"
            const response = await jiraApi.transitionIssue(task.ticket_id, "Done");

            if (response.success) {
                toast.dismiss(toastId);
                toast.success(`✓ transitioned ${task.ticket_id} to Done`);

                // Proceed with local approval
                await onApprove(task);
            } else {
                toast.dismiss(toastId);
                toast.error(`Failed to transition ${task.ticket_id}`, {
                    description: "Could not move ticket to Done. Please check Jira permissions."
                });
            }
        } catch (error: any) {
            console.error("Jira transition failed", error);
            toast.dismiss(toastId);
            const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
            toast.error(`Failed to transition ${task.ticket_id}`, {
                description: errorMsg
            });
        } finally {
            setIsChecking(false);
        }
    };

    return {
        handleApproveWithCheck,
        isChecking
    };
}
