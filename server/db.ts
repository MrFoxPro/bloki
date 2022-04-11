import fs from 'node:fs';
import path from 'node:path';

const db = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './static/data.json'), { encoding: 'utf8' }));
const paintings = new Map<string, Buffer>();

function getImgPath(type: 'blobs' | 'images', id: string, ext = 'png') {
   return path.resolve(process.cwd(), `./static/${type}/${id}.${ext}`);
}

function saveImage(type: 'blobs' | 'images', id, buf, ext = 'png') {
   fs.writeFileSync(getImgPath(type, id, ext), buf);
}
function deleteImage(type: 'blobs' | 'images', id, ext = 'png') {
   const path = getImgPath(type, id, ext);
   if (fs.existsSync(path)) {
      fs.rmSync(path);
   }
}

db.docs
   .filter(x => x.shared)
   .forEach(doc => {
      const blob = fs.readFileSync(getImgPath('blobs', doc.id));
      paintings.set(doc.id, blob);
   });

setInterval(() => {
   paintings.forEach((buf, docId) => {
      saveImage('blobs', docId, buf);
   });
   fs.writeFileSync(path.resolve(process.cwd(), './static/data.json'), JSON.stringify(db, null, 3));
}, 5 * 1000);

export { db, paintings, saveImage, deleteImage,getImgPath };