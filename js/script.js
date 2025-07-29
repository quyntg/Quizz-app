let current = 0;
const pageSize = 40;
let currentPage = 0;
const totalQuestions = questions.length;
const totalPages = Math.ceil(totalQuestions / pageSize);
let timerDuration = 30 * 60; // 30 phút = 1800 giây
let timerInterval;
let isSubmitted = false;
let totalTimeSpent = 0; // giây
let timerStartAt = null;

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

// Hiển thị câu hỏi tại vị trí idx
function showQuestion(idx) {
	current = idx;
	const q = questions[idx] || {
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
		if (q.userAnswer === option.id) {
			li.classList.add('selected');
		}
		
		// Nếu đã nộp bài → xử lý chấm điểm màu
		if (isSubmitted) {
			// Nếu là đáp án đúng → tô xanh
			if (String(option.id) === String(q.correct)) {
				li.classList.add('correct-answer');
			}
			// Nếu người dùng chọn sai → tô đỏ
			else if (q.userAnswer === option.id) {
				li.classList.add('wrong-answer');
			}
		} else {
			// Nếu chưa nộp thì cho chọn
			li.addEventListener('click', () => {
				opts.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
				li.classList.add('selected');
				questions[idx].userAnswer = option.id;
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
	// google.script.run.withSuccessHandler(data => {
	// 	questions = data;
	// 	initNav();        // ← tạo nav theo số lượng mới
	// 	showQuestion(current);
	// 	startCountdown(); // Bắt đầu đếm ngược
	// }).getQuestions();

	initNav();        // ← tạo nav theo số lượng mới
	showQuestion(current);
	startCountdown(); // Bắt đầu đếm ngược
}

function updateAnsweredNav() {
	const navItems = document.querySelectorAll('#questionNav li');
	questions.forEach((q, i) => {
		const li = navItems[i];
		if (li) {
			if (q.userAnswer) {
				li.classList.add('answered');
			} else {
				li.classList.remove('answered');
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

	questions.forEach((q, idx) => {
		const navItem = document.querySelectorAll('#questionNav li')[idx];

		if (!q.userAnswer) {
			// Chưa làm
			unansweredCount++;
			navItem.classList.remove('correct', 'wrong');
			navItem.classList.add('unanswered');
		} else if (String(q.userAnswer) === String(q.correct)) {
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
}

function closeResultModal() {
	document.getElementById('resultModal').style.display = 'none';
}

// Khởi tạo khi load trang
window.onload = () => {
	initNav(); // Hiển thị trước nav
	showQuestion(0); // Hiển thị ô đầu
	loadQuestions(); // Lấy dữ liệu
};