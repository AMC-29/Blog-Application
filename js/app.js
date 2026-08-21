/**
 * app.js
 * Home page: lists all published blogs and supports client-side search.
 */

let allBlogs = [];

function stripMarkdown(text) {
    return text
        .replace(/[#*_>`-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatDate(dateString) {
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function renderBlogs(blogs) {
    const blogList = document.getElementById('blogList');
    const emptyState = document.getElementById('emptyState');

    blogList.innerHTML = '';

    if (blogs.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    blogs.forEach((blog) => {
        const preview = stripMarkdown(blog.content).slice(0, 140);

        const card = document.createElement('div');
        card.className = 'blog-card';
        card.style.cursor = 'pointer';

        const heading = document.createElement('h3');
        heading.textContent = blog.title;

        const excerpt = document.createElement('p');
        excerpt.textContent = preview + (stripMarkdown(blog.content).length > 140 ? '…' : '');

        const meta = document.createElement('div');
        meta.className = 'blog-meta';

        const author = document.createElement('span');
        author.textContent = `${blog.username} · ${formatDate(blog.created_at)}`;

        const readMore = document.createElement('span');
        readMore.className = 'read-more';
        readMore.textContent = 'Read more →';

        meta.append(author, readMore);
        card.append(heading, excerpt, meta);

        card.addEventListener('click', () => {
            window.location.href = `blog.html?id=${blog.id}`;
        });

        blogList.appendChild(card);
    });
}

async function loadBlogs() {
    try {
        const data = await apiFetch('blogs/get_all.php');
        allBlogs = data.blogs;
        renderBlogs(allBlogs);
    } catch (err) {
        console.error('Failed to load blogs:', err);
        renderBlogs([]);
    }
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();

        const filtered = term
            ? allBlogs.filter(
                  (blog) =>
                      blog.title.toLowerCase().includes(term) ||
                      blog.content.toLowerCase().includes(term) ||
                      blog.username.toLowerCase().includes(term)
              )
            : allBlogs;

        renderBlogs(filtered);
    });
}

Auth.ready.then(() => loadBlogs());
