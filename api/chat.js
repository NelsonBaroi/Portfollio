// The upstream model is unavailable. Never misrepresent this as model loading.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  return res.status(503).json({error:'AI chat is temporarily unavailable.',guide:'https://nbaroi.com/chat.html',contact:'mailto:nelson6114007@gmail.com'});
}
