/**
 * Playbook Module
 * Generate and manage marketing action plans
 */

import { getActiveBrand, updateBrand } from '../../core/brand/brand-manager';
import { Playbook, PlaybookTask, ChannelStrategy } from '../../types';
import { generateUniqueId, getDateString } from '../../core/storage';

// ============================================
// PLAYBOOK PROMPT
// ============================================

export const PLAYBOOK_PROMPT = `
## Marketing Playbook

Generate actionable marketing plans based on strategy.

### Playbook Structure

1. **Quick Wins** (Week 1-2)
   - Low effort, high impact
   - Optimize existing assets
   - Fix obvious issues

2. **Foundation** (Week 3-4)
   - Set up tracking
   - Create core content
   - Build systems

3. **Growth** (Month 2+)
   - Scale what works
   - Test new approaches
   - Iterate based on data

### Task Format

Each task should be:
- Specific and actionable
- Have clear success criteria
- Be completable in reasonable time
- Have priority indicator

### Progress Tracking

- Track task completion
- Note blockers
- Adjust based on results

### Natural Language Triggers

- "create a playbook"
- "what should I do first"
- "marketing plan"
- "action plan"
- "next steps"
`;

// ============================================
// PLAYBOOK FUNCTIONS
// ============================================

/**
 * Generate a playbook from channel strategy
 */
export function generatePlaybook(
  brandId: string,
  channelStrategy: ChannelStrategy
): Playbook {
  const tasks: PlaybookTask[] = [];
  let taskId = 1;

  // Week 1: Quick wins based on priority channels
  if (channelStrategy.priority1) {
    tasks.push(
      ...generateChannelTasks(channelStrategy.priority1, 'Week 1', taskId)
    );
    taskId += 3;
  }

  // Week 2: Secondary priorities
  if (channelStrategy.priority2) {
    tasks.push(
      ...generateChannelTasks(channelStrategy.priority2, 'Week 2', taskId)
    );
    taskId += 3;
  }

  // Week 3-4: Foundation
  tasks.push(
    createTask(taskId++, 'Set up analytics tracking for all channels', 'Week 3'),
    createTask(taskId++, 'Create content calendar for next month', 'Week 3'),
    createTask(taskId++, 'Audit and update key landing pages', 'Week 4'),
    createTask(taskId++, 'Document current marketing processes', 'Week 4')
  );

  // Handle channels to pause
  for (const channel of channelStrategy.avoid) {
    tasks.push(
      createTask(taskId++, `Pause and audit ${channel.name}`, 'Week 1')
    );
  }

  return {
    generated: getDateString(),
    tasks,
  };
}

/**
 * Generate tasks for a channel recommendation
 */
function generateChannelTasks(
  recommendation: { name: string; action: string; reason: string },
  week: string,
  startId: number
): PlaybookTask[] {
  const tasks: PlaybookTask[] = [];
  const channel = recommendation.name.toLowerCase();

  switch (recommendation.action) {
    case 'scale':
      tasks.push(
        createTask(startId, `Increase ${recommendation.name} budget by 20%`, week),
        createTask(startId + 1, `Test new audience segments in ${recommendation.name}`, week),
        createTask(startId + 2, `Create additional ${channel.includes('seo') ? 'content' : 'ad variations'}`, week)
      );
      break;

    case 'optimize':
      tasks.push(
        createTask(startId, `Audit current ${recommendation.name} performance`, week),
        createTask(startId + 1, `Identify top 3 optimization opportunities`, week),
        createTask(startId + 2, `Implement quick-win optimizations`, week)
      );
      break;

    case 'start':
      tasks.push(
        createTask(startId, `Research ${recommendation.name} best practices`, week),
        createTask(startId + 1, `Set up ${recommendation.name} account/infrastructure`, week),
        createTask(startId + 2, `Create initial ${channel.includes('seo') ? 'content' : 'campaigns'}`, week)
      );
      break;

    case 'maintain':
      tasks.push(
        createTask(startId, `Review ${recommendation.name} performance metrics`, week),
        createTask(startId + 1, `Document what's working in ${recommendation.name}`, week)
      );
      break;
  }

  return tasks;
}

/**
 * Create a task
 */
function createTask(
  id: number,
  task: string,
  week?: string
): PlaybookTask {
  return {
    id: `task-${id}`,
    task,
    week,
    status: 'pending',
  };
}

/**
 * Add a task to the playbook
 */
export function addPlaybookTask(
  brandId: string,
  task: string,
  week?: string
): PlaybookTask | null {
  const brand = getActiveBrand();
  if (!brand || brand.id !== brandId) return null;

  const playbook = brand.strategy?.playbook || { generated: getDateString(), tasks: [] };

  const newTask: PlaybookTask = {
    id: generateUniqueId('task'),
    task,
    week,
    status: 'pending',
  };

  playbook.tasks.push(newTask);

  try {
    updateBrand(brandId, {
      strategy: {
        ...brand.strategy!,
        playbook,
      },
    });
    return newTask;
  } catch {
    return null;
  }
}

/**
 * Update task status
 */
export function updateTaskStatus(
  brandId: string,
  taskId: string,
  status: PlaybookTask['status'],
  notes?: string
): boolean {
  const brand = getActiveBrand();
  if (!brand || brand.id !== brandId) return false;

  const playbook = brand.strategy?.playbook;
  if (!playbook) return false;

  const task = playbook.tasks.find((t) => t.id === taskId);
  if (!task) return false;

  task.status = status;
  if (status === 'completed') {
    task.completedDate = getDateString();
  }
  if (notes) {
    task.notes = notes;
  }

  try {
    updateBrand(brandId, {
      strategy: {
        ...brand.strategy!,
        playbook,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get pending tasks
 */
export function getPendingTasks(brandId: string): PlaybookTask[] {
  const brand = getActiveBrand();
  if (!brand || brand.id !== brandId) return [];

  return (brand.strategy?.playbook?.tasks || []).filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  );
}

/**
 * Get completed tasks
 */
export function getCompletedTasks(brandId: string): PlaybookTask[] {
  const brand = getActiveBrand();
  if (!brand || brand.id !== brandId) return [];

  return (brand.strategy?.playbook?.tasks || []).filter(
    (t) => t.status === 'completed'
  );
}

/**
 * Format playbook for display
 */
export function formatPlaybook(playbook: Playbook): string {
  let output = `📋 MARKETING PLAYBOOK\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `Generated: ${playbook.generated}\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Group by week
  const weeks = new Map<string, PlaybookTask[]>();

  for (const task of playbook.tasks) {
    const week = task.week || 'Unscheduled';
    if (!weeks.has(week)) {
      weeks.set(week, []);
    }
    weeks.get(week)!.push(task);
  }

  const statusEmoji = {
    pending: '⬜',
    in_progress: '🔄',
    completed: '✅',
    cancelled: '❌',
    deferred: '⏸️',
  };

  for (const [week, tasks] of weeks) {
    output += `📅 ${week}\n`;
    for (const task of tasks) {
      output += `${statusEmoji[task.status]} ${task.task}`;
      if (task.notes) output += ` (${task.notes})`;
      if (task.completedDate) output += ` [done ${task.completedDate}]`;
      output += `\n`;
    }
    output += `\n`;
  }

  // Summary
  const completed = playbook.tasks.filter((t) => t.status === 'completed').length;
  const total = playbook.tasks.length;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `Progress: ${completed}/${total} tasks completed (${Math.round((completed / total) * 100)}%)\n`;

  return output;
}
