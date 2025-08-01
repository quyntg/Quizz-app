let current = 0;
const pageSize = 40;
let currentPage = 0;
let generatedQuestions = [];
let totalQuestions = 0;
let totalPages = 0;
let timerDuration = 30 * 60; // 30 phút = 1800 giây
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
        window.location.href = 'load.html';
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

        // Xác định đáp án đúng mới dựa vào id cũ (correct là vị trí 1-4 trước khi trộn)
        let oldCorrectId = q.correct ? parseInt(q.correct) : null;
        let correctOption = oldCorrectId ? q.options[oldCorrectId - 1] : null;
        // Tìm vị trí mới của đáp án đúng sau khi trộn
        let newCorrect = "";
        if (correctOption) {
            newCorrect = options.findIndex(opt => opt.context === correctOption.context) + 1;
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
                options: [
                    { context: row.A || "", id: 1 },
                    { context: row.B || "", id: 2 },
                    { context: row.C || "", id: 3 },
                    { context: row.D || "", id: 4 }
                ],
                correct: correctId ? correctId.toString() : "", // Lưu vị trí đáp án đúng (1-4) dạng chuỗi
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
			alert("⏰ Hết thời gian làm bài!");
			submitExam(); // Tự động nộp bài
		}
	}, 1000);
}

function updateTimerDisplay(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	document.getElementById("timerDisplay").innerText =
		`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
	totalTimeSpent = parseInt(localStorage.getItem('totalTimeSpent')) || 0;

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
	const confirmed = confirm("Bạn có chắc chắn muốn nộp bài không?");
	if (confirmed) {
		submitExam(); // Nếu đồng ý thì mới nộp bài
	}
}

function submitExam() {
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
}

function closeResultModal() {
	document.getElementById('resultModal').style.display = 'none';
}

function newExam() {
	localStorage.clear();
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