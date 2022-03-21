

export function Test2Page() {

   return <div style={{
      width: '100%',
      height: '100%',
   }}>
      <div style={{
         width: '200px',
         height: '200px',
         position: 'absolute',
         background: 'red'
      }}
         // contentEditable
         // draggable={false}
         onMouseLeave={() => console.log('leave')}
      >
            Et cupiditate voluptate.Et cupiditate voluptate.Et cupiditate voluptate.Et cupiditate voluptate.Et cupiditate voluptate.
      </div>
      <div style={{
         width: '200px',
         height: '200px',
         position: 'absolute',
         background: 'red',
         transform: 'translate(250px, 0px)'
      }}
         // contentEditable
         // draggable={false}
         onMouseLeave={() => console.log('leave')}
      >
            Et cupiditate voluptate.Et cupiditate voluptate.Et cupiditate voluptate.Et cupiditate voluptate.Et cupiditate voluptate.
      </div>
   </div>;
}