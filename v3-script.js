/* ============================================================
   Shared script for the v2 pages: dashboard / course / assignment /
   participant / instructor. Every section below checks that its elements
   exist before wiring up listeners, so this one file is safe to include
   on every page even though each page only has some of these components.
   ============================================================ */

// ---------- Generic toast + demo-download helpers ----------
// Used everywhere below so that every button gives some visible feedback instead of doing
// nothing (per explicit request: 我功能都要可以互動喔，不要給我卡在那邊).
function showToast(msg){
  let el=document.getElementById('__toast');
  if(!el){ el=document.createElement('div'); el.id='__toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>el.classList.remove('show'),2200);
}
function simulateDownload(btn,filename){
  const original=btn.textContent;
  btn.disabled=true;
  btn.textContent='Preparing…';
  setTimeout(()=>{
    btn.textContent='✓ Downloaded';
    showToast('⬇ '+filename+' downloaded (demo)');
    setTimeout(()=>{ btn.textContent=original; btn.disabled=false; },1600);
  },700);
}

// ---------- Top nav: user menu + edit mode ----------
const userMenuBtn=document.getElementById('userMenuBtn');
const userMenuPanel=document.getElementById('userMenuPanel');
userMenuBtn?.addEventListener('click',(e)=>{
  e.stopPropagation();
  userMenuPanel?.classList.toggle('open');
});
document.getElementById('signOutBtn')?.addEventListener('click',(e)=>{
  e.preventDefault();
  showToast('👋 Signed out (demo)');
  userMenuPanel?.classList.remove('open');
});
document.addEventListener('click',(e)=>{
  if(userMenuPanel && userMenuPanel.classList.contains('open') && !userMenuPanel.contains(e.target) && e.target!==userMenuBtn && !userMenuBtn?.contains(e.target)){
    userMenuPanel.classList.remove('open');
  }
});
const editModeToggle=document.getElementById('editModeToggle');
editModeToggle?.addEventListener('change',()=>{
  showToast(editModeToggle.checked ? '✏️ Edit mode on' : 'Edit mode off');
});

// ---------- Generic modal open/close helper ----------
function openModal(id){ document.getElementById(id)?.classList.add('open'); }
function closeModal(id){ document.getElementById(id)?.classList.remove('open'); }
document.querySelectorAll('[data-open-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>openModal(btn.getAttribute('data-open-modal')));
});
document.querySelectorAll('[data-close-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>closeModal(btn.getAttribute('data-close-modal')));
});
document.querySelectorAll('.modal-overlay').forEach(overlay=>{
  overlay.addEventListener('click',(e)=>{ if(e.target===overlay) overlay.classList.remove('open'); });
});

// ---------- Horizontal scroll row buttons ----------
document.querySelectorAll('[data-scroll-target]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const row=document.querySelector(btn.getAttribute('data-scroll-target'));
    if(!row)return;
    const dir=btn.getAttribute('data-dir')==='prev'?-1:1;
    row.scrollBy({left:dir*280,behavior:'smooth'});
  });
});

// ---------- Course cards on the Dashboard -> open the Course page ----------
document.querySelectorAll('.course-card').forEach(card=>{
  card.addEventListener('click',()=>{ window.location.href = card.dataset.href || 'v3-course.html'; });
});

// ---------- Course search / filter ----------
function setupFilter(formSelector,cardSelector){
  const form=document.querySelector(formSelector);
  if(!form)return;
  const input=form.querySelector('input[type="search"]');
  const teacher=form.querySelector('[data-filter="teacher"]');
  const year=form.querySelector('[data-filter="year"]');
  const cards=()=>document.querySelectorAll(cardSelector);
  function apply(){
    const q=(input?.value||'').trim().toLowerCase();
    const t=teacher?.value||'';
    const y=year?.value||'';
    cards().forEach(card=>{
      const name=(card.dataset.name||'').toLowerCase();
      const cardTeacher=card.dataset.teacher||'';
      const cardYear=card.dataset.year||'';
      const matches=(!q||name.includes(q)) && (!t||cardTeacher===t) && (!y||cardYear===y);
      card.style.display=matches?'':'none';
    });
  }
  input?.addEventListener('input',apply);
  teacher?.addEventListener('change',apply);
  year?.addEventListener('change',apply);
}
setupFilter('#courseFilter','.course-card[data-name]');

// ---------- All-courses "+" card ----------
document.querySelectorAll('.all-courses-card').forEach(card=>{
  const plus=card.querySelector('.plus');
  plus?.addEventListener('click',(e)=>{
    e.stopPropagation();
    const nowDone = plus.textContent.trim()!=='✓';
    plus.textContent = nowDone ? '✓' : '+';
    plus.style.background = nowDone ? '#16a34a' : '';
    plus.style.color = nowDone ? '#fff' : '';
    card.querySelector('span')?.replaceChildren(document.createTextNode(nowDone ? 'Added to Dashboard' : 'All Courses Area'));
  });
  card.addEventListener('click',(e)=>{
    if(e.target===plus)return;
    window.location.href = card.getAttribute('data-browse-href') || '#all-courses';
  });
});

// ---------- Achievement "View Full" + Timetable "View Full" (comments #17 / #18) ----------
// Both open a modal; what's inside is our own call per the comment ("你自己決定長怎樣先").

// ---------- Week block collapse (Course page) ----------
document.querySelectorAll('.week-block .week-head').forEach(head=>{
  head.addEventListener('click',()=>{
    head.closest('.week-block').classList.toggle('collapsed');
  });
});
document.getElementById('collapseAllBtn')?.addEventListener('click',(e)=>{
  const blocks=document.querySelectorAll('.week-block');
  const anyOpen=[...blocks].some(b=>!b.classList.contains('collapsed'));
  blocks.forEach(b=>b.classList.toggle('collapsed',anyOpen));
  e.target.textContent = anyOpen ? 'Expand all' : 'Collapse all';
});

// ---------- Homework rows collapse as their own mini "section" ----------
document.querySelectorAll('.sub-section .sub-section-head').forEach(head=>{
  head.addEventListener('click',(e)=>{
    if(e.target.closest('.bm-btn') || e.target.closest('.status-btn'))return;
    head.closest('.sub-section').classList.toggle('collapsed');
  });
});

// ---------- Instructor page accordion rows ----------
document.querySelectorAll('.info-row .info-row-head').forEach(head=>{
  head.addEventListener('click',()=>head.closest('.info-row').classList.toggle('collapsed'));
});

// ---------- Material status (see the multi-state dropdown at the end of this file) ----------
// Kept as the shared store so v3-preview.html's "Activity Details" tick still reads the
// same list of completed ids.
const COMPLETE_KEY='learngold_completed_v3';
function getCompleted(){ try{ return JSON.parse(localStorage.getItem(COMPLETE_KEY))||[]; }catch(e){ return []; } }
function saveCompleted(list){ try{ localStorage.setItem(COMPLETE_KEY, JSON.stringify(list)); }catch(e){} }
function isCompleted(id){ return getCompleted().includes(id); }

// ---------- Download All (comment #14: 要有download all / 最後可以全部下載課件) ----------
document.getElementById('downloadAllBtn')?.addEventListener('click',()=>{
  const btn=document.getElementById('downloadAllBtn');
  const original=btn.textContent;
  btn.textContent='Preparing files…';
  btn.disabled=true;
  setTimeout(()=>{
    btn.textContent='✓ All materials downloaded';
    setTimeout(()=>{ btn.textContent=original; btn.disabled=false; },1800);
  },900);
});

// ---------- Click a material row to preview it (comment #15) ----------
// Clicking a material item navigates to a real standalone page (v3-preview.html) that
// simulates opening a ppt/word/pdf file, with its own Download + Bookmark actions — see
// v3-preview.html. Each .material-item link already carries ?id=&title=&type=&week= in its
// href (set directly in the HTML), so no click-interception JS is needed here anymore.

// ---------- Bookmarks ----------
const BOOKMARK_KEY='learngold_bookmarks_v3';
function getBookmarks(){ try{ return JSON.parse(localStorage.getItem(BOOKMARK_KEY))||[]; }catch(err){ return []; } }
function saveBookmarks(list){ try{ localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list)); }catch(err){} }
function topicLabel(id){
  const row=document.getElementById(id);
  const label=row?.querySelector('.m-title') || row?.querySelector('.material-item');
  return label ? label.textContent.trim() : id;
}
function refreshBookmarkUI(){
  const marks=getBookmarks();
  document.querySelectorAll('.bm-btn').forEach(btn=>{
    const on=marks.includes(btn.dataset.bmId);
    btn.textContent = on ? '★' : '☆';
    btn.classList.toggle('active',on);
  });
  const countEl=document.getElementById('bmCount');
  if(countEl) countEl.textContent = marks.length ? `(${marks.length})` : '';
  const listEl=document.getElementById('bookmarksList');
  if(listEl){
    listEl.innerHTML = marks.length
      ? marks.map(id=>`<a href="#${id}" class="bm-entry" data-id="${id}">⭐ ${topicLabel(id)}</a>`).join('')
      : '<div class="bm-empty">尚未收藏任何項目 · No bookmarks yet</div>';
  }
}
document.querySelectorAll('.bm-btn').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    e.preventDefault();
    e.stopPropagation();
    const id=btn.dataset.bmId;
    let marks=getBookmarks();
    marks = marks.includes(id) ? marks.filter(m=>m!==id) : [...marks, id];
    saveBookmarks(marks);
    refreshBookmarkUI();
  });
});
const bookmarksBtn=document.getElementById('bookmarksBtn');
const bookmarksPanel=document.getElementById('bookmarksPanel');
bookmarksBtn?.addEventListener('click',(e)=>{
  e.stopPropagation();
  bookmarksPanel?.classList.toggle('open');
});
bookmarksPanel?.addEventListener('click',(e)=>{
  const entry=e.target.closest('.bm-entry');
  if(!entry)return;
  e.preventDefault();
  const target=document.getElementById(entry.dataset.id);
  if(target){
    target.classList.remove('collapsed');
    target.closest('.week-block')?.classList.remove('collapsed');
    target.scrollIntoView({behavior:'smooth',block:'center'});
  }
  bookmarksPanel.classList.remove('open');
});
document.addEventListener('click',(e)=>{
  if(bookmarksPanel && bookmarksPanel.classList.contains('open') && !bookmarksPanel.contains(e.target) && e.target!==bookmarksBtn){
    bookmarksPanel.classList.remove('open');
  }
});
refreshBookmarkUI();

// ---------- Course-wide progress readout driven by Mark as Complete state ----------
// This also drives the TOC sidebar's own "X% · Y of N" readout (#tocPct/#tocLabel/#tocBar).
// That readout used to be driven by scroll position ("topics viewed" as you scrolled past
// them) — removed per explicit request (全部改成靜態，不要跟著動了): it's now based purely on
// Mark as Complete state, same as the rest of the page, so it only changes when you actually
// click something — never from scrolling.
function updateCourseProgress(){
  const items=document.querySelectorAll('.status-btn');
  if(!items.length)return;
  const done=[...items].filter(b=>b.classList.contains('state-complete')).length;
  const pct = items.length ? Math.round((done/items.length)*100) : 0;
  const pctEl=document.getElementById('coursePct');
  const labelEl=document.getElementById('courseCompleteLabel');
  if(pctEl) pctEl.textContent=pct+'%';
  if(labelEl) labelEl.textContent=`${done} of ${items.length} topics complete`;
  const tocPctEl=document.getElementById('tocPct');
  const tocLabelEl=document.getElementById('tocLabel');
  const tocBarEl=document.getElementById('tocBar');
  if(tocPctEl) tocPctEl.textContent=pct+'%';
  if(tocLabelEl) tocLabelEl.textContent=`${done} of ${items.length} topics complete`;
  if(tocBarEl) tocBarEl.style.width=pct+'%';
}

// ---------- Participant page: search + group filter ----------
const participantSearch=document.getElementById('participantSearch');
const groupFilter=document.getElementById('groupFilter');
function applyParticipantFilter(){
  const q=(participantSearch?.value||'').trim().toLowerCase();
  const g=groupFilter?.value||'';
  document.querySelectorAll('.participant-table tbody tr').forEach(row=>{
    const name=(row.dataset.name||'').toLowerCase();
    const group=row.dataset.group||'';
    row.hidden = !((!q||name.includes(q)) && (!g||group===g));
  });
}
participantSearch?.addEventListener('input',applyParticipantFilter);
groupFilter?.addEventListener('change',applyParticipantFilter);

// ---------- Calendar page: filters actually work now ----------
// Category checkboxes (Deadlines/Courses/School Events/Exams) + per-course checkboxes
// both drive visibility of the matching .cal-chip (month grid) and .week-ahead-item
// (Timetable panel) — a course chip only shows when BOTH its "Courses" category AND
// its own course box are checked.
const calFilterBoxes=[...document.querySelectorAll('[data-cal-filter]')];
const calCourseBoxes=[...document.querySelectorAll('[data-cal-course]')];
if(calFilterBoxes.length || calCourseBoxes.length){
  const COURSE_CLASSES=['calc','ds','thermo','linalg'];
  function applyCalendarFilter(){
    const catState={};
    calFilterBoxes.forEach(b=>{ catState[b.dataset.calFilter]=b.checked; });
    const courseState={};
    calCourseBoxes.forEach(b=>{ courseState[b.dataset.calCourse]=b.checked; });

    document.querySelectorAll('.cal-chip, .week-ahead-item').forEach(el=>{
      let visible = true;
      const courseClass = el.dataset.course || COURSE_CLASSES.find(c=>el.classList.contains(c));
      if(courseClass){
        visible = visible && (courseState[courseClass]!==false);
      }
      if(el.classList.contains('deadline')) visible = visible && (catState.deadline!==false);
      if(el.classList.contains('exam')) visible = visible && (catState.exam!==false);
      if(el.classList.contains('event')) visible = visible && (catState.event!==false);
      if(!el.classList.contains('deadline') && !el.classList.contains('exam') && !el.classList.contains('event') && COURSE_CLASSES.find(c=>el.classList.contains(c))){
        visible = visible && (catState.courses!==false);
      }
      el.style.display = visible ? '' : 'none';
    });
  }
  [...calFilterBoxes, ...calCourseBoxes].forEach(b=>b.addEventListener('change',applyCalendarFilter));
  applyCalendarFilter();
}

// ---------- Left-hand Table of Contents (Course page) ----------
// Static navigational list, by explicit request (算了收回、全部改成靜態、不要跟著動了、
// progress tracker 不要互相影響對方，各自滑就好): the sidebar and the material area each
// scroll completely independently now — no scrollspy, no auto-expand-on-scroll, no highlight
// that chases your scroll position, no pointer arrow. Clicking a week/topic still works (that's
// a direct user action, not "following"), and the sidebar's own overflow list (if it's ever
// tall enough to need one) scrolls on its own without touching or being touched by the material
// area's scroll position.
const tocTree=document.getElementById('tocTree');
if(tocTree){
  const tocWeeks=[...tocTree.querySelectorAll('.toc-week')];
  const tocSubs=[...tocTree.querySelectorAll('.toc-sub')];

  function setWeekOpen(weekEl,open){ weekEl.classList.toggle('collapsed',!open); }

  tocWeeks.forEach(weekEl=>{
    const head=weekEl.querySelector('.toc-week-head');
    head.addEventListener('click',()=>{
      const willOpen=weekEl.classList.contains('collapsed');
      setWeekOpen(weekEl,willOpen);
      const mainBlock=document.getElementById(weekEl.dataset.week);
      mainBlock?.classList.toggle('collapsed',!willOpen);
      if(willOpen){ mainBlock?.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });

  tocSubs.forEach(sub=>{
    sub.addEventListener('click',(e)=>{
      e.preventDefault();
      const target=document.querySelector(sub.getAttribute('href'));
      if(!target)return;
      const weekEl=sub.closest('.toc-week');
      setWeekOpen(weekEl,true);
      document.getElementById(weekEl.dataset.week)?.classList.remove('collapsed');
      target.classList.remove('collapsed');
      target.scrollIntoView({behavior:'smooth',block:'center'});
    });
  });

  function setAll(open){
    tocWeeks.forEach(w=>setWeekOpen(w,open));
    document.querySelectorAll('.week-block').forEach(b=>b.classList.toggle('collapsed',!open));
    const btn=document.getElementById('collapseAllBtn');
    if(btn) btn.textContent = open ? 'Collapse all' : 'Expand all';
  }
  document.getElementById('tocExpandAll')?.addEventListener('click',(e)=>{e.preventDefault();setAll(true);});
  document.getElementById('tocCollapseAll')?.addEventListener('click',(e)=>{e.preventDefault();setAll(false);});

  document.getElementById('tocSearch')?.addEventListener('input',(e)=>{
    const q=e.target.value.trim().toLowerCase();
    tocWeeks.forEach(weekEl=>{
      const text=weekEl.textContent.toLowerCase();
      const match=!q||text.includes(q);
      weekEl.hidden=!match;
      if(q && match) setWeekOpen(weekEl,true);
    });
  });
}

updateCourseProgress();

// ============================================================
// Make every remaining button feel interactive (per explicit request: 我功能都要可以
// 互動喔，不要給我卡在那邊). None of this is a real backend — everything below is a
// clearly-labelled demo action (toast feedback, simulated download, or a real navigation
// to another page in the prototype) rather than a dead, unresponsive button.
// ============================================================

// ---------- Top-nav icon buttons (present on every page) ----------
document.querySelector('[title="Microsoft Teams"]')?.addEventListener('click',()=>window.open('https://teams.microsoft.com/','_blank'));
document.querySelector('[title="Outlook"]')?.addEventListener('click',()=>window.open('https://outlook.office.com/','_blank'));
document.querySelector('[title="my goldsmiths"]')?.addEventListener('click',()=>window.open('https://my.gold.ac.uk/','_blank'));
document.querySelector('[title="收藏夾 Favourites"]')?.addEventListener('click',(e)=>{
  const on=e.currentTarget.classList.toggle('active');
  showToast(on ? '★ 已加入收藏 Added to Favourites' : '☆ 已移除收藏 Removed from Favourites');
});
document.querySelector('[title="Notifications"]')?.addEventListener('click',()=>showToast('🔔 No new notifications'));
document.querySelector('[title="Messages"]')?.addEventListener('click',()=>showToast('💬 No new messages'));
document.querySelector('[title="my goldsmiths"]')?.addEventListener('click',()=>window.open('https://my.gold.ac.uk/','_blank'));
document.querySelector('[title="Outlook"]')?.addEventListener('click',()=>window.open('https://outlook.office.com/','_blank'));
document.querySelector('[title="Microsoft Teams"]')?.addEventListener('click',()=>window.open('https://teams.microsoft.com/','_blank'));


// ---------- Achievement / All-Courses header action buttons ----------
document.querySelectorAll('.achv-head .actions button').forEach(btn=>{
  const label=btn.textContent.trim();
  btn.addEventListener('click',()=>{
    if(label.includes('Export')) simulateDownload(btn,'Achievement_Report.pdf');
    else if(label.includes('Term Selector')) showToast('🗓 Term Selector (demo) — showing Term 2 · 2024–25');
    else if(label.includes('PDF')) simulateDownload(btn,'All_Courses_Summary.pdf');
    else if(label.includes('Month View')) showToast('🗓 Month View (demo)');
  });
});
document.querySelectorAll('.report-card .primary').forEach(btn=>{
  if(btn.textContent.includes('View Term Deadlines')) btn.addEventListener('click',()=>{ location.href='v3-calendar.html'; });
});
document.querySelectorAll('.quick-action-row').forEach(row=>{
  row.addEventListener('click',()=>{
    if(row.textContent.includes('Transcript')) simulateDownload(row,'Full_Transcript.pdf');
    else showToast('✉️ Email sent to your academic advisor (demo)');
  });
});
document.querySelectorAll('.pdf-btn').forEach(btn=>{
  btn.addEventListener('click',()=>simulateDownload(btn, btn.textContent.replace('⤓','').trim().replace(/\s+/g,'_')+'.pdf'));
});
document.querySelector('.archive-card.projected')?.addEventListener('click',()=>showToast('🔮 Projection based on your current trajectory (demo)'));

// ---------- Calendar page ----------
document.getElementById('addEventBtn')?.addEventListener('click',()=>showToast('+ Add Event (demo) — form not wired up in this prototype'));
document.querySelectorAll('.cal-nav-btn').forEach(btn=>{
  btn.addEventListener('click',()=>showToast('Demo prototype — only August 2026 is populated with data'));
});
document.querySelectorAll('.cal-main-head .view-btns button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.cal-main-head .view-btns button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    showToast(btn.textContent.trim()+' view (demo) — Month view is the only one populated');
  });
});

// ---------- All Courses Area: Enroll / Audit buttons ----------
document.querySelectorAll('.enroll-primary').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    e.stopPropagation();
    const done=btn.textContent.includes('✓');
    btn.textContent = done ? 'Enroll' : '✓ Enrolled';
    showToast(done ? 'Enrolment cancelled (demo)' : '✓ Enrolled (demo)');
  });
});
document.querySelectorAll('.enroll-secondary').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    e.stopPropagation();
    const done=btn.textContent.includes('✓');
    btn.textContent = done ? 'Audit' : '✓ Auditing';
    showToast(done ? 'No longer auditing (demo)' : 'Now auditing this course (demo)');
  });
});

// ---------- Instructor page: Book Office Hours ----------
document.querySelectorAll('.instructor-card .primary').forEach(btn=>{
  btn.addEventListener('click',()=>showToast('📅 Office hours request sent to Dr Rafael Tahir (demo)'));
});

// ---------- Assignment page: Choose file / upload simulation ----------
document.querySelectorAll('.upload-area .primary').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const area=btn.closest('.upload-area');
    const p=area?.querySelector('p');
    if(p) p.textContent='✓ submission_draft.pdf selected';
    btn.textContent='Change file';
    showToast('File selected (demo) — this prototype does not upload anywhere');
  });
});

// ============================================================
// Dashboard · Bento widget area (Option B)
// ============================================================

// ---------- My Courses widget: three tabs ----------
document.querySelectorAll('.bw-tabs button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const w=btn.closest('.bw');
    w.querySelectorAll('.bw-tabs button').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    w.querySelectorAll('.tabpanel').forEach(p=>p.classList.toggle('on', p.dataset.panel===btn.dataset.tab));
  });
});

// ---------- Email tutor / Enrol request ----------
document.querySelectorAll('.mail-btn').forEach(b=>{
  b.addEventListener('click',e=>{
    e.stopPropagation();
    showToast('✉️ ' + (b.title || 'Email tutor') + ' — opening your mail client');
  });
});
document.querySelectorAll('.mini-btn').forEach(b=>{
  b.addEventListener('click',e=>{
    e.stopPropagation();
    if(!b.classList.contains('done')){ b.textContent='✓ Sent'; b.classList.add('done'); }
  });
});

// ---------- + Add more widget ----------
document.getElementById('addWidgetBtn')?.addEventListener('click',()=>{
  showToast('＋ Choose a widget to add (demo)');
});

// ============================================================
// Course overview · most-recently-opened course moves to the front
// Replaces the old "Recently Accessed Courses" row: instead of duplicating
// cards in a separate strip, opening a course re-sorts the existing grid so
// that course sits first, tagged RECENT.
// ============================================================
const RECENT_KEY='learngold_recent_courses_v3';
function getRecentCourses(){
  try{ return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }catch(e){ return []; }
}
function pushRecentCourse(name){
  if(!name) return;
  let list=getRecentCourses().filter(n=>n!==name);
  list.unshift(name);
  list=list.slice(0,6);
  try{ localStorage.setItem(RECENT_KEY, JSON.stringify(list)); }catch(e){}
}
function applyRecentOrder(){
  const grid=document.getElementById('courseGrid');
  if(!grid) return;
  const recent=getRecentCourses();
  const cards=[...grid.querySelectorAll('.course-card')];
  // remember the original order so untouched courses keep their existing sequence
  cards.forEach((c,i)=>{ if(c.dataset.baseOrder===undefined) c.dataset.baseOrder=i; });
  cards.forEach(c=>{
    c.classList.remove('recent-first');
    c.querySelector('.recent-flag')?.remove();
  });
  cards.sort((a,b)=>{
    const ai=recent.indexOf(a.dataset.name), bi=recent.indexOf(b.dataset.name);
    const ar=ai===-1 ? Infinity : ai, br=bi===-1 ? Infinity : bi;
    if(ar!==br) return ar-br;
    return (+a.dataset.baseOrder)-(+b.dataset.baseOrder);
  });
  cards.forEach(c=>grid.appendChild(c));
  // the "All Courses Area +" tile must stay last (bottom-right) after re-sorting
  const addTile=grid.querySelector('.all-courses-card');
  if(addTile) grid.appendChild(addTile);
  // flag only the single most recent one — pill goes inside the cover so it sits
  // beside the Postgraduate tag rather than on top of it
  const top=cards[0];
  if(top && recent.length && recent.indexOf(top.dataset.name)===0){
    top.classList.add('recent-first');
    const flag=document.createElement('span');
    flag.className='recent-flag';
    flag.textContent='RECENT';
    (top.querySelector('.course-cover') || top).prepend(flag);
  }
}
// record a visit whenever a course card or a My Courses row is opened
// capture phase, so this records the visit before the shared .course-card handler
// further up the file kicks off window.location.href
document.querySelectorAll('#courseGrid .course-card[data-name]').forEach(card=>{
  card.addEventListener('click',()=>pushRecentCourse(card.dataset.name), true);
});
document.querySelectorAll('.crow[data-href]').forEach(row=>{
  row.addEventListener('click',e=>{
    if(e.target.closest('.mail-btn') || e.target.closest('.mini-btn')) return;
    const label=row.querySelector('.cn')?.textContent.trim().toLowerCase();
    pushRecentCourse(label);
    location.href=row.dataset.href;
  });
});
applyRecentOrder();

// ============================================================
// Nav bar "+" — pin Learning Analytics / Calendar into the navigation
// Choice is stored in localStorage so it sticks across pages and reloads.
// ============================================================
(function(){
  const btn   = document.getElementById('navAddBtn');
  const panel = document.getElementById('navAddPanel');
  if(!btn || !panel) return;

  const NAV_KEY = 'learngold_nav_pinned_v3';
  const LABELS  = { analytics:'Learning Analytics', calendar:'Calendar' };
  const wrap    = btn.closest('.nav-add');           // the "+" sits inside .nav-links
  const boxes   = [...panel.querySelectorAll('[data-nav-add]')];

  const getPinned = () => { try{ return JSON.parse(localStorage.getItem(NAV_KEY)) || []; }catch(e){ return []; } };
  const setPinned = list => { try{ localStorage.setItem(NAV_KEY, JSON.stringify(list)); }catch(e){} };

  function render(){
    const pinned = getPinned();
    // clear previously injected links
    document.querySelectorAll('.nav-links a.nav-pinned').forEach(a=>a.remove());
    pinned.forEach(key=>{
      const src = boxes.find(b=>b.dataset.navAdd===key);
      if(!src) return;
      const a = document.createElement('a');
      a.className = 'nav-pinned';
      a.href = src.dataset.navHref;
      a.textContent = LABELS[key] || key;
      const x = document.createElement('span');
      x.className = 'unpin';
      x.textContent = '×';
      x.title = 'Remove from navigation';
      x.addEventListener('click',e=>{
        e.preventDefault(); e.stopPropagation();
        setPinned(getPinned().filter(k=>k!==key));
        render();
        showToast('Removed “'+(LABELS[key]||key)+'” from the navigation');
      });
      a.appendChild(x);
      wrap.parentNode.insertBefore(a, wrap);   // always sits just before the "+"
    });
    boxes.forEach(b=>{ b.checked = pinned.includes(b.dataset.navAdd); });
  }

  btn.addEventListener('click',e=>{
    e.stopPropagation();
    panel.classList.toggle('open');
    btn.classList.toggle('open', panel.classList.contains('open'));
  });
  document.addEventListener('click',e=>{
    if(!panel.contains(e.target) && e.target!==btn){
      panel.classList.remove('open');
      btn.classList.remove('open');
    }
  });

  boxes.forEach(box=>{
    box.addEventListener('change',()=>{
      const key = box.dataset.navAdd;
      let pinned = getPinned().filter(k=>k!==key);
      if(box.checked) pinned.push(key);
      setPinned(pinned);
      render();
      showToast(box.checked
        ? '✓ “'+LABELS[key]+'” added to the navigation'
        : 'Removed “'+LABELS[key]+'” from the navigation');
    });
  });

  render();
})();

// ============================================================
// All Courses Area · "My Enrolled Courses" one-row clamp + filter
// The grid is responsive, so instead of hard-coding a card count we hide every
// card whose offsetTop is below the first one — that stays correct at any width.
// ============================================================
(function(){
  const grid   = document.getElementById('enrolledGrid');
  const toggle = document.getElementById('enrolledToggle');
  const form   = document.getElementById('enrolledFilter');
  if(!grid) return;

  let expanded = false;

  function visibleCards(){
    return [...grid.querySelectorAll('.course-card')].filter(c=>c.dataset.filteredOut!=='1');
  }

  function applyClamp(){
    const cards = visibleCards();
    cards.forEach(c=>c.classList.remove('row-hidden'));
    if(expanded || !cards.length){ updateToggle(cards.length, cards.length); return; }
    const firstTop = cards[0].offsetTop;
    let shown = 0;
    cards.forEach(c=>{
      if(c.offsetTop > firstTop + 4){ c.classList.add('row-hidden'); }
      else { shown++; }
    });
    updateToggle(shown, cards.length);
  }

  function updateToggle(shown, total){
    if(!toggle) return;
    if(total <= shown && !expanded){ toggle.style.display='none'; return; }
    toggle.style.display='';
    toggle.textContent = expanded ? 'Show less ⌃' : `Show all (${total}) ⌄`;
  }

  toggle?.addEventListener('click',()=>{ expanded = !expanded; applyClamp(); });

  // filter: search + status + year, then re-clamp what's left
  if(form){
    const input  = form.querySelector('input[type="search"]');
    const status = form.querySelector('[data-filter="status"]');
    const year   = form.querySelector('[data-filter="year"]');
    function applyFilter(){
      const q=(input?.value||'').trim().toLowerCase();
      const st=status?.value||'', y=year?.value||'';
      grid.querySelectorAll('.course-card').forEach(card=>{
        const name=(card.dataset.name||'').toLowerCase();
        const ok = (!q||name.includes(q)) &&
                   (!st||(card.dataset.status||'')===st) &&
                   (!y ||(card.dataset.year||'')===y);
        card.dataset.filteredOut = ok ? '0' : '1';
        card.style.display = ok ? '' : 'none';
      });
      applyClamp();
    }
    input?.addEventListener('input',applyFilter);
    status?.addEventListener('change',applyFilter);
    year?.addEventListener('change',applyFilter);
  }

  window.addEventListener('resize',applyClamp);
  applyClamp();
})();

// ---------- Browse catalog cards (Auditing / Discover) ----------
document.querySelectorAll('.browse-card').forEach(card=>{
  if(card.getAttribute('onclick')) return;   // legacy inline handler wins
  card.addEventListener('click',()=>showToast('Course catalogue — demo only'));
});

// ============================================================
// Calendar · deadline chip -> detail modal -> Assessment & Feedback
// ============================================================
(function(){
  const modal = document.getElementById('ddlModal');
  if(!modal) return;

  const elTitle = document.getElementById('ddlTitle');
  const elDate  = document.getElementById('ddlDate');
  const elDue   = document.getElementById('ddlDue');
  const elCode  = document.getElementById('ddlCode');
  const elMod   = document.getElementById('ddlModule');
  const elCount = document.getElementById('ddlCountdown');
  const elGo    = document.getElementById('ddlGo');

  // "Tue 4 Aug 2026" + "17:00" -> how many days from today
  function daysUntil(dateStr, timeStr){
    const d = new Date((dateStr||'').replace(/^\w{3}\s/,'') + ' ' + (timeStr||'00:00'));
    if(isNaN(d)) return null;
    const now = new Date();
    return Math.ceil((d - now) / 86400000);
  }

  document.querySelectorAll('.cal-chip.deadline').forEach(chip=>{
    chip.addEventListener('click',e=>{
      e.stopPropagation();
      const d = chip.dataset;
      elTitle.textContent = chip.textContent.replace(/\s*Due\s*$/i,'').trim() || 'Deadline';
      elDate.textContent  = d.date   || '—';
      elDue.textContent   = d.due ? d.due + (parseInt(d.due) < 12 ? ' AM' : '') : '—';
      elCode.textContent  = d.code   || '—';
      elMod.textContent   = d.module || '—';

      const left = daysUntil(d.date, d.due);
      if(left === null)      elCount.textContent = 'Deadline';
      else if(left < 0)      elCount.textContent = 'Closed';
      else if(left === 0)    elCount.textContent = 'Due today';
      else                   elCount.textContent = left + (left === 1 ? ' day left' : ' days left');

      elGo.setAttribute('href', d.assessment || 'v3-assignment.html');
      openModal('ddlModal');
    });
  });
})();

// ============================================================
// Course tab bar · keep the course context on the shared pages
// Reading List / Participant / Instructor are shared between modules. When you
// arrive from Interaction Science (…?c=is) their Course and Assessment tabs must
// point back at the IS pages, not at Applied UX, and the context must survive
// hopping between those three tabs.
// ============================================================
(function(){
  const tabbar = document.querySelector('.tabbar');
  if(!tabbar) return;

  const COURSES = {
    is: { course:'v3-course-is.html', assessment:'v3-assignment-is.html' },
    ux: { course:'v3-course.html',    assessment:'v3-assignment.html'    }
  };
  const SHARED = ['v3-reading-list.html','v3-participant.html','v3-instructor.html'];

  const ctx = new URLSearchParams(location.search).get('c');
  if(!ctx || !COURSES[ctx]) return;          // no context -> leave the defaults alone

  tabbar.querySelectorAll('a').forEach(a=>{
    const label = a.textContent.trim().toLowerCase();
    const file  = a.getAttribute('href').split('?')[0];
    if(label === 'course')          a.setAttribute('href', COURSES[ctx].course);
    else if(label === 'assessment') a.setAttribute('href', COURSES[ctx].assessment);
    else if(SHARED.includes(file))  a.setAttribute('href', file + '?c=' + ctx);
  });
})();

// ============================================================
// Weekly Materials · multi-state status pill with a tag dropdown
//   Unread (default) · Downloaded · Complete · + Custom Tag
// One shared menu element is moved to whichever pill was clicked, so 90+ rows
// don't each carry their own markup.
// ============================================================
(function(){
  const pills = [...document.querySelectorAll('.status-btn')];
  if(!pills.length) return;

  const STATUS_KEY = 'learngold_material_status_v3';
  const PRESETS = {
    unread:     { label:'Unread',     cls:'state-unread'     },
    downloaded: { label:'Downloaded', cls:'state-downloaded' },
    complete:   { label:'✓ Complete', cls:'state-complete'   }
  };

  const readStore  = () => { try{ return JSON.parse(localStorage.getItem(STATUS_KEY)) || {}; }catch(e){ return {}; } };
  const writeStore = o  => { try{ localStorage.setItem(STATUS_KEY, JSON.stringify(o)); }catch(e){} };

  // keep the legacy completed-id list in sync so v3-preview.html still matches
  function syncCompletedList(){
    const store = readStore();
    saveCompleted(Object.keys(store).filter(id => store[id].state === 'complete'));
  }

  function paint(pill){
    const id    = pill.dataset.completeId;
    const entry = readStore()[id] || { state:'unread' };
    pill.classList.remove('state-unread','state-downloaded','state-complete','state-custom');
    if(entry.state === 'custom'){
      pill.classList.add('state-custom');
      pill.textContent = entry.label || 'Tag';
      pill.title = entry.label || '';
    }else{
      const p = PRESETS[entry.state] || PRESETS.unread;
      pill.classList.add(p.cls);
      pill.textContent = p.label;
      pill.title = '';
    }
  }

  function setState(pill, state, label){
    const store = readStore();
    const id = pill.dataset.completeId;
    if(state === 'unread') delete store[id];
    else store[id] = label ? { state, label } : { state };
    writeStore(store);
    syncCompletedList();
    paint(pill);
    if(typeof updateCourseProgress === 'function') updateCourseProgress();
  }

  // ---- the single shared menu ----
  const menu = document.createElement('div');
  menu.className = 'status-menu';
  menu.innerHTML = `
    <button class="status-opt" data-state="unread"><span class="swatch unread"></span>Unread<span class="tick">✓</span></button>
    <button class="status-opt" data-state="downloaded"><span class="swatch downloaded"></span>Downloaded<span class="tick">✓</span></button>
    <button class="status-opt" data-state="complete"><span class="swatch complete"></span>Complete<span class="tick">✓</span></button>
    <div class="status-sep"></div>
    <button class="status-opt add" data-state="__custom">+ Custom Tag</button>
    <div class="status-custom">
      <input type="text" maxlength="18" placeholder="e.g. 考前必看" aria-label="Custom tag">
      <div class="row">
        <button type="button" class="cancel">Cancel</button>
        <button type="button" class="save">Add tag</button>
      </div>
      <div class="hint">Up to 18 characters</div>
    </div>`;
  document.body.appendChild(menu);

  const customBox = menu.querySelector('.status-custom');
  const customInp = customBox.querySelector('input');
  let active = null;   // the pill the menu currently belongs to

  function closeMenu(){
    menu.classList.remove('open');
    customBox.classList.remove('open');
    active?.classList.remove('open');
    active = null;
  }

  function openMenu(pill){
    active = pill;
    pill.classList.add('open');
    const entry = readStore()[pill.dataset.completeId] || { state:'unread' };
    menu.querySelectorAll('.status-opt[data-state]').forEach(o=>{
      o.classList.toggle('on', o.dataset.state === entry.state);
    });
    customBox.classList.remove('open');
    customInp.value = entry.state === 'custom' ? (entry.label || '') : '';

    menu.classList.add('open');
    // position under the pill, flipping up / nudging left if it would overflow
    const r = pill.getBoundingClientRect();
    const mh = menu.offsetHeight, mw = menu.offsetWidth;
    let top  = r.bottom + 6;
    let left = r.left;
    if(top + mh > window.innerHeight - 8) top = r.top - mh - 6;
    if(left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
    menu.style.top  = Math.max(8, top) + 'px';
    menu.style.left = Math.max(8, left) + 'px';
  }

  pills.forEach(pill=>{
    paint(pill);
    pill.addEventListener('click', e=>{
      e.preventDefault();
      e.stopPropagation();
      if(active === pill){ closeMenu(); return; }
      closeMenu();
      openMenu(pill);
    });
  });

  menu.querySelectorAll('.status-opt[data-state]').forEach(opt=>{
    opt.addEventListener('click', e=>{
      e.stopPropagation();
      if(!active) return;
      if(opt.dataset.state === '__custom'){
        customBox.classList.add('open');
        customInp.focus();
        return;
      }
      setState(active, opt.dataset.state);
      closeMenu();
    });
  });

  function saveCustom(){
    const text = customInp.value.trim();
    if(!active) return;
    if(!text){ customInp.focus(); return; }
    setState(active, 'custom', text);
    closeMenu();
  }
  customBox.querySelector('.save').addEventListener('click', e=>{ e.stopPropagation(); saveCustom(); });
  customBox.querySelector('.cancel').addEventListener('click', e=>{ e.stopPropagation(); customBox.classList.remove('open'); });
  customInp.addEventListener('click', e=>e.stopPropagation());
  customInp.addEventListener('keydown', e=>{
    e.stopPropagation();
    if(e.key === 'Enter') saveCustom();
    if(e.key === 'Escape') closeMenu();
  });

  menu.addEventListener('click', e=>e.stopPropagation());
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeMenu(); });
  window.addEventListener('scroll', ()=>{ if(active) closeMenu(); }, true);
  window.addEventListener('resize', closeMenu);

  syncCompletedList();
  if(typeof updateCourseProgress === 'function') updateCourseProgress();
})();

// ============================================================
// Course tab bar "+" — let the student add their own sections
// Quiz / Resources are pinned into the secondary hierarchy and persist across
// pages via localStorage, the same way the top-nav "+" works.
// ============================================================
(function(){
  const bar = document.querySelector('.tabbar');
  const wrap = bar?.querySelector('.tab-add');
  if(!bar || !wrap) return;

  const TAB_KEY = 'learngold_tabs_pinned_v3';
  const LABELS  = { quiz:'Quiz', resources:'Resources' };
  const btn   = wrap.querySelector('.tab-add-btn');
  const panel = wrap.querySelector('.tab-add-panel');
  const boxes = [...panel.querySelectorAll('[data-tab-add]')];

  const getPinned = () => { try{ return JSON.parse(localStorage.getItem(TAB_KEY)) || []; }catch(e){ return []; } };
  const setPinned = list => { try{ localStorage.setItem(TAB_KEY, JSON.stringify(list)); }catch(e){} };

  function render(){
    const pinned = getPinned();
    bar.querySelectorAll('a.tab-pinned').forEach(a=>a.remove());
    pinned.forEach(key=>{
      const a = document.createElement('a');
      a.className = 'tab-pinned';
      a.href = '#';
      a.textContent = LABELS[key] || key;
      a.addEventListener('click',e=>{
        e.preventDefault();
        showToast(`“${LABELS[key]||key}” section — demo only`);
      });
      const x = document.createElement('span');
      x.className = 'unpin';
      x.textContent = '×';
      x.title = 'Remove this section';
      x.addEventListener('click',e=>{
        e.preventDefault(); e.stopPropagation();
        setPinned(getPinned().filter(k=>k!==key));
        render();
        showToast(`Removed “${LABELS[key]||key}”`);
      });
      a.appendChild(x);
      bar.insertBefore(a, wrap);      // always sits just before the "+"
    });
    boxes.forEach(b=>{ b.checked = pinned.includes(b.dataset.tabAdd); });
  }

  btn.addEventListener('click',e=>{
    e.stopPropagation();
    panel.classList.toggle('open');
    btn.classList.toggle('open', panel.classList.contains('open'));
  });
  document.addEventListener('click',e=>{
    if(!panel.contains(e.target) && e.target!==btn){
      panel.classList.remove('open');
      btn.classList.remove('open');
    }
  });

  boxes.forEach(box=>{
    box.addEventListener('change',()=>{
      const key = box.dataset.tabAdd;
      let pinned = getPinned().filter(k=>k!==key);
      if(box.checked) pinned.push(key);
      setPinned(pinned);
      render();
      showToast(box.checked ? `✓ “${LABELS[key]}” added` : `Removed “${LABELS[key]}”`);
    });
  });

  render();
})();
