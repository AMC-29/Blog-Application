/**
 * editor.js
 * Blog creation / editing page. Requires a logged-in session.
 */

/** Escapes HTML special characters so raw markdown can never inject tags. */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Converts a small, safe subset of Markdown (#, ##, ###, **bold**,
 * *italic*, "- " lists, paragraphs) into HTML. The input is HTML-escaped
 * first, so the output can be inserted with innerHTML without risk of XSS.
 */
function renderMarkdown(raw) {
    const escaped = escapeHtml(raw);
    const lines = escaped.split('\n');
    const htmlParts = [];
    let listBuffer = [];

    function flushList() {
        if (listBuffer.length) {
            htmlParts.push(`<ul>${listBuffer.join('')}</ul>`);
            listBuffer = [];
        }
    }

    function inline(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>');
    }

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (trimmed === '') {
            flushList();
            return;
        }

        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            htmlParts.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
            return;
        }

        const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (listMatch) {
            listBuffer.push(`<li>${inline(listMatch[1])}</li>`);
            return;
        }

        flushList();
        htmlParts.push(`<p>${inline(trimmed)}</p>`);
    });

    flushList();
    return htmlParts.join('');
}

Auth.requireLogin();

const params = new URLSearchParams(window.location.search);
const editId = params.get('id');
const isEditMode = Boolean(editId);

const titleInput = document.getElementById('blogTitle');
const contentInput = document.getElementById('blogContent');
const preview = document.getElementById('markdownPreview');
const messageEl = document.getElementById('editorMessage');
const form = document.getElementById('blogForm');
const saveButtonText = document.getElementById('saveButtonText');

function updatePreview() {
    const text = contentInput.value.trim();
    preview.innerHTML = text ? renderMarkdown(text) : 'Your blog preview will appear here.';
}

contentInput.addEventListener('input', updatePreview);

async function loadForEdit() {
    try {
        const data = await apiFetch(`blogs/get_single.php?id=${encodeURIComponent(editId)}`);
        const blog = data.blog;

        await Auth.ready;
        if (!Auth.isLoggedIn() || Number(Auth.user.id) !== Number(blog.user_id)) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('editorTitle').textContent = 'Edit Blog';
        saveButtonText.textContent = 'Update Blog';
        titleInput.value = blog.title;
        contentInput.value = blog.content;
        updatePreview();
    } catch (err) {
        showMessage(messageEl, 'Could not load this blog for editing.');
    }
}

if (isEditMode) {
    loadForEdit();
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        showMessage(messageEl, 'Please fill in both the title and the content.');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        await Auth.ready;

        if (isEditMode) {
            await apiFetch('blogs/update.php', {
                method: 'PUT',
                body: { id: editId, title, content },
            });
            window.location.href = `blog.html?id=${editId}`;
        } else {
            const data = await apiFetch('blogs/create.php', {
                method: 'POST',
                body: { title, content },
            });
            window.location.href = `blog.html?id=${data.id}`;
        }
    } catch (err) {
        showMessage(messageEl, err.message);
        submitBtn.disabled = false;
    }
});
