const base64Session = Buffer.from(JSON.stringify({
    token: 'd41d8cd98f00b204e9800998ecf8427e',
    userId: 2,
    username: 'calebapi',
    email: 'Caleb@2005'
})).toString('base64')

fetch('http://localhost:3000/api/courses/2', {
    headers: { 'Cookie': `moodle_session=${base64Session}` }
})
    .then(r => r.json())
    .then(data => {
        const pageModule = data.sections?.[0]?.modules?.find(m => m.type === 'page')
        if (pageModule) {
            console.log('Page module:', pageModule.name)
            console.log('Description:', pageModule.description?.substring(0, 200))
            console.log('Page detail content:', pageModule.pageDetail?.content?.substring(0, 500))
        } else {
            console.log('No page module found. Available modules:', data.sections?.[0]?.modules?.map(m => m.type))
        }
    })
    .catch(e => console.error('Error:', e.message))
