// attribute vec4 cursor;
attribute vec4 position;

void main() {
   // gl_Position = vec4(vec2(cursor.x, cursor.y), 0, 0);
   gl_Position = position;
}
