// src/pages/MeetingView.tsx
import React, { useState } from 'react';
import { Video, FileText, CheckCircle, Clock, ArrowLeft, Play, Plus, Loader2 } from 'lucide-react';
import { Meeting, Task, User, Priority, TaskStatus } from '../types';
import * as api from '../api/mockApi'; // Import API của bồ

interface MeetingViewProps {
  meetings: Meeting[];
  currentUser: User;
  onOpenDetail: (meeting: Meeting) => void;
}

// --- Component con: Hiển thị 1 Task do AI gợi ý ---
const AiTaskCard: React.FC<{ task: Task; onAdd: (t: Task) => void }> = ({ task, onAdd }) => {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start mb-4 hover:shadow-md transition">
            <div className="flex-1 mr-4">
                <h4 className="text-base font-bold text-slate-800 mb-1">{task.title}</h4>
                <p className="text-sm text-slate-500 mb-3">{task.description}</p>
                
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium border border-slate-200">
                        Suggested: {task.assigneeId ? 'User ' + task.assigneeId : 'Unknown'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium border ${
                        task.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-100' :
                        task.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                        Priority: {task.priority}
                    </span>
                </div>
            </div>
            <button 
                onClick={() => onAdd(task)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center shadow-sm shadow-indigo-200"
            >
                Add to Board
            </button>
        </div>
    );
};

// --- Component chính: Chi tiết cuộc họp ---
const MeetingDetail: React.FC<{ meeting: Meeting; onBack: () => void; currentUser: User }> = ({ meeting, onBack, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'recording' | 'tasks'>('transcript');
    const [aiTasks, setAiTasks] = useState<Task[]>([]);
    const [loadingAI, setLoadingAI] = useState(false);
    const [isAnalyzed, setIsAnalyzed] = useState(false);

    // Giả lập Transcript (Nếu meeting chưa có)
    const transcriptText = meeting.transcript || `
Alex: Hi everyone, let's start the weekly sync for Alpha Redesign. Sarah, how is the design system coming along?
Sarah: It's going well. I've finalized the color palette and typography. I'm currently working on the component library. I should be done by Friday.
Alex: Great. Mike, what about the backend?
Mike: I'm setting up the database schema today. I ran into a small issue with the user authentication service, but I think I can fix it by tomorrow.
Alex: Do you need any help with that?
Mike: No, I think I got it. But I might need someone to review the PR later.
Alex: Okay, I'll assign the code review to myself. Also, we need to schedule a meeting with the marketing team for the launch strategy.
Sarah: I can handle that. I'll send an invite for next Tuesday.
Alex: Perfect. Let's keep pushing. Thanks team.
    `;

    // Gọi API phân tích
    // Gọi API phân tích
const handleRunAI = async () => {
    if (!meeting.recordingUrl) {
        alert("Vui lòng hoàn thành ghi hình cuộc họp trước khi phân tích!");
        return;
    }

    setLoadingAI(true);
    setActiveTab('transcript'); // Chuyển sang Transcript để thấy kết quả STT đầu tiên

    try {
        // GỌI API THẬT KÍCH HOẠT BACKGROUND TASK
        await api.triggerAiAnalysis(meeting.id);

        // Do là Background Task, ta chỉ thông báo và chờ
        alert("Phân tích AI đã bắt đầu! Vui lòng F5 (refresh) sau 1-2 phút để xem Transcript và Task.");

        // Tạm thời dừng loading UI và set analyzed (sau này có thể dùng WebSockets để cập nhật realtime)
        setIsAnalyzed(true); 

    } catch (error) {
        console.error(error);
        alert("Lỗi: Không thể kích hoạt phân tích AI. Hãy kiểm tra Backend!");
    } finally {
        setLoadingAI(false);
    }
};

    // Thêm Task từ AI vào Board thật
    const handleAddToBoard = async (task: Task) => {
        try {
            // Gọi API tạo task thật
            await api.createTask(task, currentUser!.id); 
            alert(`Task "${task.title}" added to board successfully!`);
            
            // Xóa task khỏi list gợi ý (để tránh add 2 lần)
            setAiTasks(prev => prev.filter(t => t.id !== task.id));
        } catch (error) {
            alert("Failed to create task.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {meeting.title}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Completed</span>
                            <span>•</span>
                            <span>{new Date(meeting.startDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {isAnalyzed ? (
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">AI Analysis Active</span>
                    ) : (
                        <button 
                            onClick={handleRunAI}
                            disabled={loadingAI}
                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition flex items-center gap-2"
                        >
                            {loadingAI ? <Loader2 className="animate-spin" size={16}/> : <FileText size={16}/>}
                            Analyze Meeting
                        </button>
                    )}
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                        Share Recap
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Tabs */}
                <div className="bg-white border-b border-slate-200 px-6">
                    <div className="flex gap-8">
                        {['Summary', 'Transcript', 'Recording', 'Tasks'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                className={`py-4 text-sm font-medium border-b-2 transition ${
                                    activeTab === tab.toLowerCase() 
                                    ? 'border-indigo-600 text-indigo-600' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-8 overflow-y-auto flex-1">
                    {activeTab === 'transcript' && (
                        <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Full Transcript</h3>
                            <div className="space-y-4">
                                {transcriptText.split('\n').filter(line => line.trim()).map((line, idx) => {
                                    const [speaker, ...text] = line.split(':');
                                    return (
                                        <div key={idx} className="flex gap-4">
                                            <div className="w-16 font-semibold text-slate-900 text-sm flex-shrink-0 text-right">{speaker}:</div>
                                            <p className="text-slate-600 text-sm leading-relaxed">{text.join(':')}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="max-w-4xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">AI Detected Tasks</h3>
                            
                            {loadingAI && (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4"/>
                                    <p className="text-slate-500">Gemini is extracting tasks from the conversation...</p>
                                </div>
                            )}

                            {!loadingAI && aiTasks.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500">No tasks detected yet. Click "Analyze Meeting" to start.</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {aiTasks.map((task) => (
                                    <AiTaskCard key={task.id} task={task} onAdd={handleAddToBoard} />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'recording' && (
                        <div className="max-w-4xl mx-auto">
                            {meeting.recordingUrl ? (
                                <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700">
                                    <video 
                                        controls 
                                        className="w-full aspect-video"
                                        src={meeting.recordingUrl} 
                                        poster="https://via.placeholder.com/800x450/000000/FFFFFF?text=Meeting+Recording"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                    <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold">Recording: {meeting.title}</h4>
                                            <p className="text-xs text-slate-400">Duration: Auto-detected</p>
                                        </div>
                                        <a 
                                            href={meeting.recordingUrl} 
                                            download 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                // Nếu chưa có video thì hiện Placeholder cũ
                                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                                    <div className="bg-slate-200 p-4 rounded-full mb-3">
                                        <Play size={32} className="text-slate-400 ml-1"/>
                                    </div>
                                    <h3 className="text-slate-600 font-semibold">No Recording Available</h3>
                                    <p className="text-slate-500 text-sm mt-1">Recordings will appear here after the meeting ends.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'summary' && (
                        <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText className="text-indigo-600" size={20}/> Executive Summary
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {isAnalyzed 
                                    ? "The team discussed the progress of the Alpha Redesign project. Design system is finalized. Backend has a minor auth issue but a fix is expected by tomorrow. Marketing launch strategy meeting is scheduled for next Tuesday." 
                                    : "Click 'Analyze Meeting' to generate an executive summary."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Component View chính: List các cuộc họp ---
const MeetingView: React.FC<MeetingViewProps> = ({ meetings, currentUser, onOpenDetail }) => {
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

    if (selectedMeeting) {
        return <MeetingDetail meeting={selectedMeeting} onBack={() => setSelectedMeeting(null)}  currentUser={currentUser} />;
    }

    // Helper format giờ cho đẹp (VD: 09:30 AM)
    const formatTime = (isoString: string) => {
        if(!isoString) return '??:??';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    // Hàm xử lý khi bấm nút Join Meeting
    const handleJoinMeeting = (meetingId: string) => {
        // URL của Server Flask (Meeting App)
        // Giả sử bồ chạy Flask ở port 5000
        const meetingServerUrl = "http://localhost:5000"; 
        
        // Tạo link có kèm tham số room và name
        const targetUrl = `${meetingServerUrl}/?room=${meetingId}&name=${encodeURIComponent(currentUser.name)}`;
        
        // Mở trong tab mới
        window.open(targetUrl, '_blank');
    };

    return (
        <div className="p-8 h-full bg-slate-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Meeting Intelligence</h2>
                    <p className="text-slate-500">Review recordings, transcripts, and AI-generated insights.</p>
                </div>
                {/* Nút này sẽ được trigger từ Header của App.tsx, ở đây để tượng trưng hoặc xóa đi nếu muốn */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                    <div key={meeting.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col h-full">
                        
                        {/* Header Card: Icon Video + Ngày tháng */}
                        <div className="flex justify-between items-start mb-3">
                            <button 
                                onClick={() => handleJoinMeeting(meeting.id)}
                                className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition group tooltip-trigger relative"
                                title="Join Live Meeting"
                            >
                                <Video size={24} />
                                {/* Tooltip nhỏ hiện lên khi hover cho chuyên nghiệp */}
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                                    Join Room
                                </span>
                            </button>
                        </div>
                        
                        {/* --- PHẦN MỚI THÊM: THỜI GIAN --- */}
                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-3 bg-indigo-50/50 w-fit px-2 py-1 rounded">
                             <Clock size={14} />
                             <span>
                                {formatTime(meeting.startDate)} - {formatTime(meeting.endDate)}
                             </span>
                        </div>
                        {/* ---------------------------------- */}

                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1" title={meeting.title}>
                            {meeting.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1">
                            {meeting.description || "No description provided."}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <div className="flex -space-x-2">
                                {/* Hiển thị avatar thành viên (nếu có logic lấy user details) */}
                                {meeting.attendees.slice(0, 3).map((uid, idx) => (
                                    <div key={idx} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                                        {uid.charAt(0).toUpperCase()}
                                    </div>
                                ))}
                                {meeting.attendees.length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-500 font-medium">
                                        +{meeting.attendees.length - 3}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => setSelectedMeeting(meeting)}
                                className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 hover:underline"
                            >
                                View Detail
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MeetingView;