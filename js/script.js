let current = 0;
const pageSize = 40;
let currentPage = 0;
let generatedQuestions = [];
let totalQuestions = 0;
let totalPages = 0;
let timerDuration = 0; // 30 phút = 1800 giây
let timerInterval;
let isSubmitted = false;
let totalTimeSpent = 0; // giây
let timerStartAt = null;

function startExam() {
	window.location.href = 'exam.html';
	initNav(); // Hiển thị trước nav
	showQuestion(0); // Hiển thị ô đầu
	loadQuestions(); // Lấy dữ liệu
}

function generateExamFromQuestions(allQuestions, total, easyCount, mediumCount, hardCount) {
    const easy = allQuestions.filter(q => q.difficulty === 'easy');
    const medium = allQuestions.filter(q => q.difficulty === 'medium');
    const hard = allQuestions.filter(q => q.difficulty === 'hard');

    if (easy.length < easyCount || medium.length < mediumCount || hard.length < hardCount) {
        alert("❌ Không đủ câu hỏi theo từng mức độ yêu cầu.");
        return;
    } else {        
		if (localStorage.getItem('isStudent') == '1') {
			
		} else {
        	window.location.href = 'load.html';
		}
    }

    function pickRandom(arr, n) {
        const copy = [...arr];
        const result = [];
        while (result.length < n && copy.length > 0) {
            const idx = Math.floor(Math.random() * copy.length);
            result.push(copy.splice(idx, 1)[0]);
        }
        return result;
    }

    const selectedEasy = pickRandom(easy, easyCount);
    const selectedMedium = pickRandom(medium, mediumCount);
    const selectedHard = pickRandom(hard, hardCount);

    let exam = [...selectedEasy, ...selectedMedium, ...selectedHard];

    // 🔄 Trộn câu hỏi
    exam = shuffleArray(exam);
	
    // 🔄 Trộn đáp án từng câu
    exam = exam.map((q) => {
        const options = shuffleArray(q.options); // Trộn mảng đáp án
        let oldCorrectId = q.correct ? parseInt(q.correct) : null;
        // Xác định đáp án đúng mới dựa vào nội dung đáp án đúng (q.correct là context)
        let correctOption = q.options.find(opt => String(opt.context).trim().toLowerCase() === String(q.correct).trim().toLowerCase());
        let newCorrect = "";
        if (correctOption) {
            newCorrect = options.findIndex(opt => String(opt.context).trim().toLowerCase() === String(q.correct).trim().toLowerCase()) + 1;
        }
        return {
            ...q,
            options: options.map((opt, idx) => ({ ...opt, id: idx + 1 })),
            correct: newCorrect ? newCorrect.toString() : ""
        };
    });
    
    return exam.slice(0, total);
}

// Trộn mảng (Fisher–Yates)
function shuffleArray(arr) {
	const array = [...arr];
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}


function readFile(file) {
	const reader = new FileReader();

	reader.onload = function(e) {
		const data = new Uint8Array(e.target.result);
		const workbook = XLSX.read(data, { type: 'array' });

		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];

		const raw = XLSX.utils.sheet_to_json(sheet);

		const questions = raw.map((row, index) => {
            // Xử lý correctId (vị trí đáp án đúng, 1-4)
            let correctId = row.correctId ? parseInt(row.correctId) : null;
            // Nếu không có correctId, fallback sang so sánh nội dung (giữ logic cũ cho an toàn)
            if (!correctId && row.correct) {
                if (row.A == row.correct) correctId = 1;
                else if (row.B == row.correct) correctId = 2;
                else if (row.C == row.correct) correctId = 3;
                else if (row.D == row.correct) correctId = 4;
            }
            // Nếu vẫn không xác định được thì để null

            // Xử lý difficulty
            let difficulty = "";
            if (row.difficulty === "dễ") {
                difficulty = "easy";
            } else if (row.difficulty === "trung bình" || row.difficulty === "Trung bình") {
                difficulty = "medium";
            } else if (row.difficulty === "khó") {
                difficulty = "hard";
            }
			
			return {
				id: row.id || `Q${index + 1}`,
				question: row.question || "",
				media: row.media || "",
				subject: row.subject || "",
				grade: row.grade || "",
				options: [
					{ context: row.A || "", id: 1 },
					{ context: row.B || "", id: 2 },
					{ context: row.C || "", id: 3 },
					{ context: row.D || "", id: 4 }
				],
				correct: row.correct,
				description: row.description || "",
				difficulty,
				note: row.note || "",
			};
		});
		
		if (questions.length < localStorage.getItem('totalQuestions')) {
			alert(`❌ Số lượng câu hỏi của đề (${localStorage.getItem('totalQuestions')}) vượt quá giới hạn tối đa (${questions.length})`);
			return;
		} else {
			localStorage.setItem('questions', JSON.stringify(questions));
			const allQuestions = JSON.parse(localStorage.getItem('questions')) || [];
			const total = parseInt(localStorage.getItem('totalQuestions')) || 40;
			const easy = parseInt(localStorage.getItem('easyCount')) || 0;
			const medium = parseInt(localStorage.getItem('mediumCount')) || 0;
			const hard = parseInt(localStorage.getItem('hardCount')) || 0;
			
			let generatedQuestions = generateExamFromQuestions(allQuestions, total, easy, medium, hard);
			localStorage.setItem('questions', JSON.stringify(generatedQuestions));                        
            localStorage.setItem('isNewExam', 1);                    
            localStorage.setItem('examId', '');
		}
	};

	reader.readAsArrayBuffer(file);
}

function startCountdown(seconds = timerDuration) {
	timerStartAt = Date.now(); // Ghi lại thời điểm bắt đầu
	let timeLeft = seconds;
	updateTimerDisplay(timeLeft);
    
	timerInterval = setInterval(() => {
		timeLeft--;
		updateTimerDisplay(timeLeft);

		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			showTimeoutModal();
		}
	}, 1000);
}

function showTimeoutModal() {
	const modal = document.getElementById('timeoutModal');
	modal.classList.remove('hidden');
	document.getElementById('timeoutOk').onclick = function() {
		modal.classList.add('hidden');
		submitExam(1);
	};
}

function updateTimerDisplay(seconds) {
	let display;
	if (seconds < 0) {
		display = "00:00";
	} else {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	document.getElementById("timerDisplay").innerText = display;
}

// Tạo nav 40 ô câu hỏi
function initNav() {
	const nav = document.getElementById('questionNav');
	nav.innerHTML = '';

	for (let i = 1; i <= totalQuestions; i++) {
		const li = document.createElement('li');
		li.textContent = i;
		li.addEventListener('click', () => showQuestion(i - 1));
		nav.appendChild(li);
	}
	renderPage();
	document.getElementById('totalLength').innerText = totalQuestions;
}

// Đánh dấu ô đang active
function highlightNav(idx) {
	document.querySelectorAll('#questionNav li').forEach((li, i) => {
		li.classList.toggle('active', i === idx);
	});
}

// Hiển thị đúng 10 ô của trang hiện tại
function renderPage() {
	const items = document.querySelectorAll('#questionNav li');
	items.forEach((li, i) => {
		const pageIndex = Math.floor(i / pageSize);
		li.style.display = (pageIndex === currentPage) ? 'flex' : 'none';
	});
	// cập nhật nút phân trang
	document.getElementById('prevPage').disabled = currentPage === 0;
	document.getElementById('nextPage').disabled = currentPage >= totalPages - 1;
	document.getElementById('pageInfo').innerText = `${currentPage + 1} / ${totalPages}`;
}

// Hiển thị câu hỏi tại vị trí idx
function showQuestion(idx) {
	current = idx;
	const q = generatedQuestions[idx] || {
		question: 'Chưa có dữ liệu',
		options: [],
		correct: '-'
	};
	const options = Array.isArray(q.options) ? q.options : [];

	// Tiêu đề câu hỏi: "Câu hỏi x: ..."
	const questionTitle = document.getElementById('viewQuestion');
	questionTitle.innerHTML = `Câu hỏi ${idx + 1}:<span class="question-title"> ${q.question}</span>`;

	// Hiển thị số thứ tự
	document.getElementById('currentIndex').innerText = idx + 1;

	// Hiển thị danh sách đáp án
	const opts = document.getElementById('viewOptions');
	opts.innerHTML = '';

	['A', 'B', 'C', 'D'].forEach((label, i) => {
		const option = options[i] || { context: '', id: null };
		const li = document.createElement('li');
		li.innerHTML = `<span>${label}. ${option.context}</span>`;
		li.dataset.id = option.id;

		// Nếu người dùng đã chọn trước thì đánh dấu lại
		if (q.userAnswer === option.context) {
			li.classList.add('selected');
		}
		
		// Nếu đã nộp bài → xử lý chấm điểm màu
		if (isSubmitted) {
			// Nếu là đáp án đúng → tô xanh
			if ((i + 1).toString() === q.correct) {
				li.classList.add('correct-answer');
			}
			// Nếu người dùng chọn đáp án này và nó sai → tô đỏ
			if (
				q.userAnswer === option.context &&
				(i + 1).toString() !== q.correct
			) {
				li.classList.add('wrong-answer');
			}
			// Khoá không cho chọn lại
			li.style.pointerEvents = 'none';
			li.style.opacity = '0.6';
		} else {
			// Nếu chưa nộp thì cho chọn
			li.addEventListener('click', () => {
				opts.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
				li.classList.add('selected');
				generatedQuestions[idx].userAnswer = option.context;
				updateAnsweredNav();
			});
		}

		opts.appendChild(li);
	});

	if (isSubmitted && q.description) {
		const desc = document.createElement('div');
		desc.className = 'explanation';
		desc.innerHTML = `<strong>Giải thích:</strong> ${q.description}`;
		document.getElementById('viewOptions').appendChild(desc);
	}

	// document.getElementById('viewCorrect').innerText = q.correct;
	highlightNav(idx);
	updateAnsweredNav(); // ← cập nhật trạng thái nav
}


// Tải câu hỏi từ server và cập nhật giao diện
function loadQuestions() {
	// Kiểm tra trạng thái đã nộp bài
	isSubmitted = JSON.parse(localStorage.getItem('isSubmitted')) || false;
	generatedQuestions = JSON.parse(localStorage.getItem('questions')) || [];
	totalTimeSpent = parseInt(localStorage.getItem('examTime')) * 60 || 0;

	// Nếu đã nộp bài, hiển thị lại bài thi cũ
	if (isSubmitted) {
		totalQuestions = generatedQuestions.length;
		totalPages = Math.ceil(totalQuestions / pageSize);

		// Hiển thị thời gian đã làm bài
		const mins = Math.floor(totalTimeSpent / 60);
		const secs = totalTimeSpent % 60;
		document.getElementById("timerDisplay").innerText =
			`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

		// Khởi tạo giao diện
		initNav();
		showQuestion(0);

		// Khoá không cho chọn lại đáp án
		document.querySelectorAll('#viewOptions li').forEach(li => {
			li.style.pointerEvents = 'none';
			li.style.opacity = '0.6';
		});

		// Ẩn nút nộp bài
		const btn = document.querySelector('button[onclick="confirmSubmit()"]');
		if (btn) btn.disabled = true;
	} else {
		// Nếu chưa nộp bài, bắt đầu đếm ngược
		startCountdown();
	}

	// Chuyển trang
	document.getElementById('prevPage').addEventListener('click', () => {
		if (currentPage > 0) {
			currentPage--;
			renderPage();
		}
	});
	document.getElementById('nextPage').addEventListener('click', () => {
		const maxPage = Math.floor((totalQuestions - 1) / pageSize);
		if (currentPage < maxPage) {
			currentPage++;
			renderPage();
		}
	});
}

function updateAnsweredNav() {
	const navItems = document.querySelectorAll('#questionNav li');
	generatedQuestions.forEach((q, i) => {
		const li = navItems[i];
		if (li) {
			if (q.userAnswer) {
				li.classList.remove('unanswered'); // Xóa lớp 'unanswered' nếu đã trả lời
				li.classList.add('answered'); // Thêm lớp 'answered' cho câu đã trả lời
			} else {
				li.classList.remove('answered'); // Xóa lớp 'answered' nếu chưa trả lời
				if (isSubmitted) {
					li.classList.add('unanswered'); // Thêm lớp 'unanswered' nếu chưa trả lời và chưa nộp bài
				}
			}
		}
	});
}

function confirmSubmit() {
	// Hiển thị modal xác nhận nộp bài
	const modal = document.getElementById('confirmModal');
	modal.classList.remove('hidden');
	// Xử lý nút
	document.getElementById('confirmYes').onclick = function() {
		modal.classList.add('hidden');
		submitExam(1);
	};
	document.getElementById('confirmNo').onclick = function() {
		modal.classList.add('hidden');
	};
}

function closeConfirmModal() {
	document.getElementById('confirmModal').classList.add('hidden');
}

function submitExam(type) {
    const examId = localStorage.getItem('examId') || '';
	let studentInfo = JSON.parse(localStorage.getItem('studentInfo')) || {};
    const studentName = studentInfo.name || '';
    const studentCode = studentInfo.code || '';
    const studentSchool = studentInfo.school || '';
    const studentClass = studentInfo.class || '';
    const note = '';
	if (type == 0) {
		// Gán userAnswer là đáp án đúng cho tất cả câu hỏi
		generatedQuestions.forEach((q) => {
			const correctIndex = parseInt(q.correct) - 1;
			const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';
			q.userAnswer = correctContext;
		});
		// Đánh dấu đã nộp để khóa đáp án trên toàn bộ giao diện
		isSubmitted = true;
		localStorage.setItem('isSubmitted', true);
		// Hiển thị lại giao diện cho trang hiện tại
		renderPage();
		showQuestion(current);
		// Hiển thị modal kết quả đơn giản như resultText mẫu
		const resultText = `
			✅ Đúng: 0<br>
			❌ Sai: 0<br>
			⚠️ Chưa làm: ${totalQuestions}<br>
			⏱️ Thời gian làm bài: 0 phút 0 giây
		`;
		document.getElementById('resultBody').innerHTML = resultText;
		document.getElementById('resultModal').style.display = 'block';
		// Gửi kết quả lên BE với trạng thái chưa làm
		const resultData = {
			examId: examId,
			studentName: studentName,
			studentCode: studentCode,
			studentSchool: studentSchool,
			studentClass: studentClass,
			correct: 0,
			wrong: 0,
			unAnswer: totalQuestions,
			spentTime: 0,
			point: 0,
			note: note
		};
		saveResult(resultData);
		return;
	}
	if (isSubmitted) return; // Không nộp lại
	isSubmitted = true;
	localStorage.setItem('isSubmitted', isSubmitted); // Lưu trạng thái đã nộp
	clearInterval(timerInterval); // Dừng đếm giờ

	// Tính thời gian làm bài
	const now = Date.now();
	totalTimeSpent = Math.floor((now - timerStartAt) / 1000); // giây
	const mins = Math.floor(totalTimeSpent / 60);
	const secs = totalTimeSpent % 60;
	const timeText = `${mins} phút ${secs} giây`;

	let correctCount = 0;
	let wrongCount = 0;
	let unansweredCount = 0;

	generatedQuestions.forEach((q, idx) => {
		const navItem = document.querySelectorAll('#questionNav li')[idx];
		// Lấy context đáp án đúng theo vị trí correct
		const correctIndex = parseInt(q.correct) - 1;
		const correctContext = (q.options && q.options[correctIndex]) ? q.options[correctIndex].context : '';

		if (!q.userAnswer) {
			// Chưa làm
			unansweredCount++;
			navItem.classList.remove('correct', 'wrong');
			navItem.classList.add('unanswered');
		} else if (String(q.userAnswer).trim().toLowerCase() === String(correctContext).trim().toLowerCase()) {
			// Đúng
			correctCount++;
			navItem.classList.remove('wrong', 'unanswered');
			navItem.classList.add('correct');
		} else {
			// Sai
			wrongCount++;
			navItem.classList.remove('correct', 'unanswered');
			navItem.classList.add('wrong');
		}
	});

	// Khoá không cho chọn nữa
	document.querySelectorAll('#viewOptions li').forEach(li => {
		li.style.pointerEvents = 'none';
		li.style.opacity = '0.6';
	});

	// Ẩn nút nộp bài (nếu có)
	const btn = document.querySelector('button[onclick="confirmSubmit()"]');
	if (btn) btn.disabled = true;
	
	// Hiển thị kết quả bằng modal
	const resultText = `
		✅ Đúng: ${correctCount}<br>
		❌ Sai: ${wrongCount}<br>
		⚠️ Chưa làm: ${unansweredCount}<br>
		⏱️ Thời gian làm bài: ${timeText}
	`;
	
	showQuestion(current);
	document.getElementById('resultBody').innerHTML = resultText;
	document.getElementById('resultModal').style.display = 'block';
	localStorage.setItem('questions', JSON.stringify(generatedQuestions));

	// Đẩy dữ liệu lên BE
    const point = Math.round((correctCount / totalQuestions) * 10 * 100) / 100; // Điểm = (số câu đúng / tổng câu hỏi) * 10, làm tròn đến 2 chữ số thập phân
    const spentTime = totalTimeSpent;
    const resultData = {
        examId: examId,
        studentName: studentName,
        studentCode: studentCode,
        studentSchool: studentSchool,
        studentClass: studentClass,
        correct: correctCount,
        wrong: wrongCount,
        unAnswer: unansweredCount,
        spentTime: spentTime,
        point: point,
        note: note
    };
    saveResult(resultData);
}

// Gửi kết quả thi lên backend
async function saveResult(resultData) {
    const url = ggApiUrl;
    const formData = new FormData();
    formData.append('action', 'submitExam');
    Object.keys(resultData).forEach(key => {
        formData.append(key, resultData[key]);
    });
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        console.log('✅ Đã gửi kết quả lên BE:', data);
        return data;
    } catch (err) {
        console.error('❌ Lỗi gửi kết quả lên BE:', err);
        return null;
    }
}

function closeResultModal() {
	document.getElementById('resultModal').style.display = 'none';
}

function newExam() {
	localStorage.setItem('isSubmitted', false);
	localStorage.setItem('questions', JSON.stringify([]));
	window.location.href = 'create.html';
}

function generatedOptions(question) {
	let newQuestion = [];
	for (let i = 0; i < question.length; i++) {
		const q = question[i];
		const options = ['A', 'B', 'C', 'D'].map((opt, idx) => ({
			context: q[opt] || '',
			id: idx + 1 // Đảm bảo ID từ 1 đến 4
		}));
		q['options'] = options;

		// Xử lý difficulty
		let difficulty = "";
		if (q.difficulty === "dễ") {
			difficulty = "easy";
		} else if (q.difficulty === "trung bình") {
			difficulty = "medium";
		} else if (q.difficulty === "khó") {
			difficulty = "hard";
		}
		q['difficulty'] = difficulty;
		newQuestion.push(q);
	}

	return newQuestion;
}

async function getTeacherById() {
	let id = JSON.parse(localStorage.getItem('user')).id || 0;
	const url = ggApiUrl + `?action=getTeacherById&id=${encodeURIComponent(id)}`;
	try {
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		const data = await res.json();
		console.log("✅ Lấy thông tin giáo viên thành công:", data);
		localStorage.setItem('user', JSON.stringify(data));
	} catch (err) {
		console.error("❌ Lỗi khi gọi API:", err);
	}
}