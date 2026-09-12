import React, { useState } from "react";
import { 
  CheckSquare, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Sparkles,
  Layers
} from "lucide-react";
import { getTasks, saveTask, deleteTask, getUsers } from "../services/storage";

export default function TasksManager() {
  const [tasks, setTasks] = useState(getTasks());
  const [users] = useState(getUsers());
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const refreshList = () => {
    setTasks(getTasks());
  };

  const filteredTasks = tasks.filter(task => {
    if (memberFilter !== "all" && task.assignedTo !== memberFilter) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setSelectedTask({
      id: "",
      title: "",
      assignedTo: users[0]?.username || "mt206.ruhit",
      assignedName: users[0]?.name || "Ruhit",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "High",
      category: "Outreach",
      status: "To Do",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setSelectedTask({ ...task });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this member task?")) {
      deleteTask(id);
      refreshList();
      showToast("Task deleted & synced.");
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedTask.title) {
      alert("Title is required.");
      return;
    }
    const matchedUser = users.find(u => u.username === selectedTask.assignedTo);
    const taskToSave = {
      ...selectedTask,
      assignedName: matchedUser?.name || selectedTask.assignedName || selectedTask.assignedTo
    };
    saveTask(taskToSave);
    refreshList();
    setIsModalOpen(false);
    showToast("Task saved & auto-synced with Supabase!");
  };

  const toggleStatus = (task) => {
    const nextStatus = task.status === "Completed" ? "To Do" : task.status === "To Do" ? "In Progress" : "Completed";
    const updated = { ...task, status: nextStatus };
    saveTask(updated);
    refreshList();
    showToast(`Task marked as ${nextStatus}!`);
  };

  const completedCount = tasks.filter(t => t.status === "Completed").length;

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-neon text-brand-black px-4 py-2.5 rounded-xl font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Member Daily Task Tracker</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-neon font-mono">
              {completedCount} / {tasks.length} Completed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Track daily team operations, laptop grading quotas, cold WhatsApp outreach, and social posts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-neon hover:bg-brand-lime text-brand-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Member Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status filter */}
        <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg ${statusFilter === "all" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400"}`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setStatusFilter("To Do")}
            className={`px-3 py-1.5 rounded-lg ${statusFilter === "To Do" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400"}`}
          >
            To Do
          </button>
          <button
            onClick={() => setStatusFilter("In Progress")}
            className={`px-3 py-1.5 rounded-lg ${statusFilter === "In Progress" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400"}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter("Completed")}
            className={`px-3 py-1.5 rounded-lg ${statusFilter === "Completed" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400"}`}
          >
            Completed
          </button>
        </div>

        {/* Member filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Assigned Member:</span>
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
          >
            <option value="all">All Team Members</option>
            {users.map(u => (
              <option key={u.username} value={u.username}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-12 text-center text-gray-400">
            <CheckSquare className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No tasks found</h3>
            <p className="text-xs mt-1">Assign a new task to your team member.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "Completed";
            return (
              <div 
                key={task.id} 
                className={`bg-brand-surface border rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4 transition-all ${
                  isDone ? "border-brand-border/40 opacity-75" : "border-brand-border hover:border-brand-neon/40"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Status checkbox button */}
                  <button
                    onClick={() => toggleStatus(task)}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      isDone 
                        ? "bg-brand-neon border-brand-neon text-brand-black" 
                        : "border-gray-500 hover:border-brand-neon bg-brand-dark text-transparent"
                    }`}
                    title="Click to toggle task status"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  {/* Task details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === "Urgent" 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                          : task.priority === "High" 
                          ? "bg-amber-500/20 text-amber-300" 
                          : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {task.priority}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-brand-dark text-[10px] text-gray-300 font-mono">
                        {task.category}
                      </span>

                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-lime" />
                        <span>Due: {task.dueDate}</span>
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold text-white ${isDone ? "line-through text-gray-400" : ""}`}>
                      {task.title}
                    </h3>

                    {task.notes && (
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                        {task.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand-neon" />
                        <strong className="text-gray-200">{task.assignedName}</strong>
                      </span>
                      <span>•</span>
                      <span className={`font-semibold ${isDone ? "text-brand-neon" : "text-amber-400"}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-neon hover:bg-brand-dark"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-brand-dark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {selectedTask.id ? "Edit Member Task" : "Assign New Member Task"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  placeholder="e.g. Send 50 WhatsApp stock offers to Mexico buyers"
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Assign To Member</label>
                  <select
                    value={selectedTask.assignedTo}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    {users.map(u => (
                      <option key={u.username} value={u.username}>{u.name} ({u.username})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={selectedTask.dueDate}
                    onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                    className="w-full px-2.5 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <select
                    value={selectedTask.category}
                    onChange={(e) => setSelectedTask({ ...selectedTask, category: e.target.value })}
                    className="w-full px-2.5 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="Outreach">Outreach</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                    className="w-full px-2.5 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={selectedTask.notes || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, notes: e.target.value })}
                  placeholder="Additional details for the member..."
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
