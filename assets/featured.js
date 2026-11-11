// Weekly picks for the home page. Edit by hand, then publish; no database change is needed.
// Every text is [中文, English]. `pick.id` is the work's id from its page address (#work/<id>).
// Leave `headline` or `reason` empty to fall back to the work's own title or to hide the note.
// A missing or unpublished pick falls back to the most liked recent work, preferring one with a cover.
window.AIMadeFeatured={
  updated:'2026-11-11',
  pick:{
    id:'7eedcc1a-99ac-438b-9a90-3caaae3b95c4',
    label:['本週主打','Pick of the week'],
    headline:['把試用筆記，整理成作者看得懂的回饋','Turn your test notes into feedback creators can use'],
    reason:['','']
  },
  // Shelves fill themselves from recent works. `where` takes a category key and/or feedback:true;
  // `tone` picks the shelf colour from a category key. A work appears on one shelf only.
  lists:[
    {label:['新手也用得到','Easy to start with'],title:['可以直接複製的 Prompt','Prompts you can copy'],tone:'prompt',where:{category:'prompt'}},
    {label:['作者想聽你的意見','Creators want your feedback'],title:['正在找人試玩的作品','Looking for testers'],tone:'tool',where:{feedback:true}}
  ]
};
