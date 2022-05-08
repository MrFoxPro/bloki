<br>
<div align="center">
	<img 
		src="https://user-images.githubusercontent.com/17229619/167316774-9ed7ffa6-32a6-4c82-8a76-f79e0d2f9a17.png" 
		align="center"
		width="650"
	/>

</div> 

<h2 align="center">Bloki.app</h2>
<p align="center"><a href="https://bloki.app">Try it</a></p>

## About

Bloki — app for creating any kind of content.  
Take notes. Compose math homework or a shopping list.  
Join team and do it together.  
Bloki is similiar to checkered notebook and complements it with modern tools.  
Bloki gives you creative freedom in working with text and media.  
![block-editing1](https://user-images.githubusercontent.com/17229619/162616223-7bada943-3944-4fe4-83fa-76e96ec87f3d.gif)
Collaboration demo: https://youtu.be/PsEwt068DGk  

## Development
DOTNET_WATCH_RESTART_ON_RUDE_EDIT=1 to avoid dotnet questions

## Features
- Set any block size
- Move block to any position of the document
- Change block type (code, headers, images, etc)
- Draw on top of blocks 
- Do it with your team
- Manage document with hierarchy

## Roadmap

### Block ⏳
- [x] Change block type via menu
- [ ] Save ration when resizing with shift pressed
#### Text block ⏳
- [x] Size depending on text size
- [ ] Decide good minimal text block size
- [ ] Edit text inside block 
<img src="https://user-images.githubusercontent.com/17229619/162611730-1f9cfe16-1a17-46d1-b493-a548ca935d18.png" width="350" />  

- [ ] Additional spaces to H1, H2 headers
#### Code block ⏳
- [ ] Codemirror
- [ ] Syntax change selector
#### Image block ⏳
- [x] Optimal image ratio on paste
- [ ] Downloading
- [ ] Filters
#### Table block ❌
- [ ] Setup header
- [ ] Implement
- [ ] Controls for addding rows/cols
- [ ] Cell style
### System ❌
- [ ] ASP.NET Core backend
- [ ] PostgreSQL DB
- [ ] Prefabs
- [x] I18n
- [ ] Search across documents
- [ ] Nested documents
<img src="https://user-images.githubusercontent.com/17229619/162612650-52093ee8-8523-4a53-8d86-2f89a312f54a.png" width="350" />  

#### Plugins ❌
- [ ] Math
- [ ] 3D
- [ ] Desmos
- [ ] Wolfram Alpha
- [ ] Marketplace
#### Collaboration ⏳
- [ ] Sync text and block editing via CRDT or OT
