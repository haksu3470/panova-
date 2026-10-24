'use client';

import { Plus } from 'lucide-react';

interface TasksTabProps {
  tasks: any[];
  staffMembers: any[];
  isUpperManagement: boolean;
  userRole: string;
  t: any;
  newTaskTitle: string;
  setNewTaskTitle: (val: string) => void;
  newTaskAssignee: string;
  setNewTaskAssignee: (val: string) => void;
  newTaskBackup: string;
  setNewTaskBackup: (val: string) => void;
  newTaskDueDate: string;
  setNewTaskDueDate: (val: string) => void;
  handleCreateTask: (e: React.FormEvent) => void;
  toggleTaskStatus: (taskId: string, currentStatus: string) => void;
}

export default function TasksTab({
  tasks,
  staffMembers,
  isUpperManagement,
  userRole,
  t,
  newTaskTitle,
  setNewTaskTitle,
  newTaskAssignee,
  setNewTaskAssignee,
  newTaskBackup,
  setNewTaskBackup,
  newTaskDueDate,
  setNewTaskDueDate,
  handleCreateTask,
  toggleTaskStatus
}: TasksTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-700" /> {t.newTaskTitleHeader}
        </h3>
        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskDescLabel}</label>
            <select 
              required 
              value={newTaskTitle} 
              onChange={(e) => setNewTaskTitle(e.target.value)} 
              className="w-full px-3.5 py-2.5 rounded-xl border font-bold text-slate-900 bg-white cursor-pointer text-xs sm:text-sm"
            >
              <option value="" disabled>{t.selectTaskPrompt || 'Select Task...'}</option>
              
              {(isUpperManagement || userRole === 'source_country') && (
                <optgroup label={t.taskGroupSource}>
                  <option value="Pasaportu kontrol et">{t.taskPassportCheck}</option>
                  <option value="Aday ön görüşmesi planla">{t.taskInterviewPlan}</option>
                  <option value="Aday bilgilerini güncelle">{t.taskUpdateCandidate}</option>
                  <option value="Eksik evrak talep et">{t.taskRequestDocs}</option>
                </optgroup>
              )}

              {(isUpperManagement || userRole === 'target_country') && (
                <optgroup label={t.taskGroupTarget}>
                  <option value="İşveren talebini kaydet">{t.taskSaveDemand}</option>
                  <option value="Aday eşleştirme yap">{t.taskMatchCandidate}</option>
                  <option value="İş teklifi hazırla">{t.taskPrepareOffer}</option>
                  <option value="Performans ve uyum takibi yap">{t.taskTrackPerformance}</option>
                </optgroup>
              )}

              {(isUpperManagement || userRole === 'field_officer') && (
                <optgroup label={t.taskGroupField}>
                  <option value="Seyahat tarihini gir">{t.taskEnterTravelDate}</option>
                  <option value="Konaklama ve karşılama planla">{t.taskPlanAccommodation}</option>
                  <option value="Destek taleplerini yönet">{t.taskManageSupport}</option>
                  <option value="Saha görev durumunu güncelle">{t.taskUpdateFieldStatus}</option>
                </optgroup>
              )}

              {isUpperManagement && (
                <optgroup label={t.taskGroupManagement}>
                  <option value="Sistem ve logları denetle">{t.taskAuditSystem}</option>
                  <option value="Mali ve stratejik kararları onayla">{t.taskApproveStrategic}</option>
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskAssigneeLabel}</label>
            <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border font-bold text-slate-900 bg-white cursor-pointer text-xs sm:text-sm">
              {Array.from(new Set(staffMembers.map(s => s.name))).map((name, idx) => (
                <option key={idx} value={name as string} className="text-slate-900 bg-white">{name as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskBackupAssigneeLabel}</label>
            <select value={newTaskBackup} onChange={(e) => setNewTaskBackup(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border font-bold text-slate-900 bg-white cursor-pointer text-xs sm:text-sm">
              {Array.from(new Set(staffMembers.map(s => s.name))).map((name, idx) => (
                <option key={idx} value={name as string} className="text-slate-900 bg-white">{name as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskDueDateLabel}</label>
            <input 
              type="text" 
              value={newTaskDueDate} 
              onChange={(e) => setNewTaskDueDate(e.target.value)} 
              placeholder={t.dateFormatPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border font-medium text-slate-900 bg-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]" 
            />
          </div>
          <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition cursor-pointer shadow-md text-xs sm:text-sm">
            {t.saveTaskBtn}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.taskListHeader}</h3>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${task.status === 'completed' ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm'}`}>
              <div className="flex items-start sm:items-center gap-3">
                <input type="checkbox" checked={task.status === 'completed'} onChange={() => toggleTaskStatus(task.id, task.status)} className="w-5 h-5 accent-[#2e7d32] cursor-pointer mt-0.5 sm:mt-0 shrink-0" />
                <div>
                  <h4 className={`font-bold text-xs sm:text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.assigneeText}: <strong>{task.assignee}</strong> | {t.backupText}: <strong>{task.backup_assignee}</strong> | {t.dueDateText}: {task.due_date}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase w-fit ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                {task.status === 'completed' ? t.statusCompleted : t.statusPending}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}