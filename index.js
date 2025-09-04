import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import routes from './routes/index.mjs'

const app = new express()

app.use(express.static('public'))

//setters
app.set('views', path.resolve('views'))
app.set('view engine', 'ejs')
app.set('PORT', process.env.PORT || 6972)

//middleware
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use('/', routes)

app.listen(app.get('PORT'), () => {
  console.log(`Server listen at PORT ${app.get('PORT')}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})