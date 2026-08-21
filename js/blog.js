/**
 * blog.js
 * Single blog view: renders one post and, for the owner, shows the
 * edit/delete controls.
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

function getBlogId() {
    return new URLSearchParams(window.location.search).get('id');
}

function formatDate(dateString) {
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

async function loadBlog() {
    const id = getBlogId();
    const container = document.getElementById('blogContent');

    if (!id) {
        container.innerHTML = '<p>No blog was specified.</p>';
        return;
    }

    try {
        const data = await apiFetch(`blogs/get_single.php?id=${encodeURIComponent(id)}`);
        const blog = data.blog;

        const article = document.createElement('div');
        article.className = 'blog-article';

        const heading = document.createElement('h1');
        heading.textContent = blog.title;

        const meta = document.createElement('div');
        meta.className = 'article-meta';
        meta.textContent = `By ${blog.username} · ${formatDate(blog.created_at)}`;

        const body = document.createElement('div');
        body.className = 'article-content';
        body.innerHTML = renderMarkdown(blog.content);

        article.append(heading, meta, body);
        container.innerHTML = '';
        container.appendChild(article);

        await Auth.ready;

        if (Auth.isLoggedIn() && Number(Auth.user.id) === Number(blog.user_id)) {
            const actions = document.getElementById('blogActions');
            actions.classList.remove('hidden');

            document.getElementById('editBlogBtn').href = `editor.html?id=${blog.id}`;

            document.getElementById('deleteBlogBtn').addEventListener('click', async () => {
                if (!confirm('Delete this blog? This cannot be undone.')) return;

                try {
                    await apiFetch('blogs/delete.php', {
                        method: 'DELETE',
                        body: { id: blog.id },
                    });
                    window.location.href = 'index.html';
                } catch (err) {
                    alert(err.message);
                }
            });
        }
    } catch (err) {
        const message =
            err.message === 'Blog not found.'
                ? 'This blog could not be found.'
                : 'Something went wrong loading this blog.';
        container.innerHTML = `<p>${message}</p>`;
    }
}

Auth.ready.then(loadBlog);
