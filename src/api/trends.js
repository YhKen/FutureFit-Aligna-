import feeds from '../lib/news-feed.cjs';
const trends=feeds.createFeedService();
export async function GET(request){
 const sector=new URL(request.url).searchParams.get('sector');
 if(!Object.hasOwn(feeds.sectors,sector))return Response.json({error:'invalid-sector'},{status:400,headers:{'Cache-Control':'no-store'}});
 try{return Response.json(await trends(sector),{headers:{'Cache-Control':'public, max-age=0, s-maxage=900, stale-while-revalidate=300'}});}
 catch{return Response.json({error:'source-unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
