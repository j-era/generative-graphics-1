import Stats from "stats-js"

import MouseControls from "./MouseControls"

import fragmentShader from "./shader/fragmentShader.glsl"
import vertexShader from "./shader/vertexShader.glsl"

import * as THREE from "three"
import { BoxGeometry, Camera, Clock, Color, DirectionalLight, DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, PointLight, Points, RepeatWrapping, Scene, ShaderMaterial, SphereGeometry, TextureLoader, TorusKnotGeometry, UniformsLib, UniformsUtils, Vector3, WebGLRenderer } from "three"
import defaultBackgroundImage from "../assets/textures/background/default-background.jpg"
import defaultNoiseImage from "../assets/textures/noise/default-noise-texture.png"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"

export default class View {
  constructor(model) {
    this.model = model

    this.subscribeToModel()

    this.clock = new Clock(false)
    this.step = 0.0

    this.updateRenderer()

    this.scene = new Scene()
    this.camera = this.createPerspectiveCamera()
    this.lights = this.createLights()
    for (const light in this.lights) {
      this.scene.add(this.lights[light])
    }

    // this.shaderMaterial = this.createShaderMaterial()

    this.backgroundScene = new Scene()
    this.backgroundCamera = new Camera()
    this.backgroundPlane = this.createBackgroundPlane()
    this.backgroundScene.add(this.backgroundCamera)
    this.backgroundScene.add(this.backgroundPlane)

    this.stats = new Stats()
    this.stats.setMode(1)
    this.statsVisible = false

    window.addEventListener("resize", this.onWindowResize.bind(this), false)
  }

  async init() {
    const gltfLoader = new GLTFLoader().setPath("/");

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'draco/' );
    gltfLoader.setDRACOLoader( dracoLoader );

    const gltf = await gltfLoader.loadAsync('model.gltf')
    
    const model = gltf.scene
    model.position.y = -0.3

    model.scale.x = 0.005
    model.scale.y = 0.005
    model.scale.z = 0.005

    const attributes = this.model.attributes
    const { r, g, b } = this.getColor(attributes.ambientLight)

    model.traverse((o) => {
      if (o.isMesh) {
        o.material.onBeforeCompile = function (shader) {
          shader.uniforms = UniformsUtils.merge([
            shader.uniforms,
            // UniformsLib.lights, // ?
            {
              uStep: { type: "f", value: this.step },
              uScale: { type: "f", value: attributes.scale },
              uMorph: { type: "i", value: 0 },
              uMorphStep: { type: "f", value: this.morphStep },
              uNoiseTexture: { type: "t" },
              uColorTexture: { type: "t" },
              // uAmbientLight: {
              //   type: "v3", value: new Vector3(r, g, b)
              // },
              uPointSize: { type: "f", value: attributes.pointSize }
            }
          ])

          shader.vertexShader = vertexShader
        
          o.material.userData.shader = shader;
        }

        o.material.side = DoubleSide
        o.material.transparent = true
        o.material.blending = THREE[attributes.blending]
        o.material.wireframe = attributes.wireframe
        o.material.wireframeLinewidth = attributes.lineWidth
        o.material.depthTest = attributes.depthTest
        o.material.lights = true
        o.material.derivatives = true
        o.material.opacity = attributes.opacity

        // o.material = this.shaderMaterial
      }
    })

    this.object3D = model.children[0]

    this.scene.add(this.object3D)

    this.modelLoaded = true

    this.loadNoiseTexture()
    this.loadColorTexture()

    this.render()
  }

  subscribeToModel() {
    this.model.on("change:noiseTexture", () => {
      if (this.model.attributes.colorTexture === "None") {
        this.loadColorTexture()
      }

      this.loadNoiseTexture()
    })

    this.model.on("change:colorTexture", () => {
      this.loadColorTexture()
    })

    this.model.on("change:object3d", () => {
      this.scene.remove(this.object3D)
      // this.object3D = this.createObject3D(this.object3D.geometry, this.shaderMaterial)
      this.scene.add(this.object3D)
    })

    this.model.on("change:geometry", () => {
      this.object3D.geometry = this.createGeometry()
    })

    this.model.on("change:scale", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.userData.shader.uniforms.uScale.value = value
        }
      })
    })

    this.model.on("change:wireframe", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.wireframe = value
        }
      })
    })

    this.model.on("change:lineWidth", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.wireframeLinewidth = value
        }
      })
    })

    this.model.on("change:ambientLight", (model, value) => {
      const { r, g, b } = this.getColor(value)

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.userData.shader.uniforms.uAmbientLight.value = new Vector3(r, g, b)
        }
      })
    })

    this.model.on("change:directionalLightX", (model, value) => {
      this.scene.getObjectByName("directionalLightX").visible = value

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.needsUpdate = true
        }
      })
    })

    this.model.on("change:directionalLightY", (model, value) => {
      this.scene.getObjectByName("directionalLightY").visible = value

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.needsUpdate = true
        }
      })
    })

    this.model.on("change:directionalLightZ", (model, value) => {
      this.scene.getObjectByName("directionalLightZ").visible = value

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.needsUpdate = true
        }
      })
    })

    this.model.on("change:pointLight1", (model, value) => {
      this.scene.getObjectByName("pointLight1").visible = value

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.needsUpdate = true
        }
      })
    })

    this.model.on("change:pointLight2", (model, value) => {
      this.scene.getObjectByName("pointLight2").visible = value

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.needsUpdate = true
        }
      })
    })

    this.model.on("change:morph", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          const uMorph = o.material.userData.shader.uniforms.uMorph

          if (value === "off") {
            uMorph.value = 0
          } else if (value === "forwards") {
            uMorph.value = 1
          } else if (value === "backwards") {
            uMorph.value = 2
          }
        }
      })
    })

    this.model.on("change:segmentsX", () => {
      this.object3D.geometry = this.createGeometry()
    })

    this.model.on("change:segmentsY", () => {
      this.object3D.geometry = this.createGeometry()
    })

    this.model.on("change:rotationX", (model, value) => {
      this.object3D.rotation.x = value
    })

    this.model.on("change:rotationY", (model, value) => {
      this.object3D.rotation.y = value
    })

    this.model.on("change:rotationZ", (model, value) => {
      this.object3D.rotation.z = value
    })

    this.model.on("change:zoom", (model, value) => {
      this.camera.zoom = value
      this.camera.updateProjectionMatrix()
    })

    this.model.on("change:cameraPosZ", (model, value) => {
      this.camera.position.z = value
      this.camera.updateProjectionMatrix()
    })

    this.model.on("change:depthTest", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.depthTest = value
        }
      })
    })

    this.model.on("change:opacity", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.opacity = value
        }
      })
    })

    this.model.on("change:blending", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.blending = THREE[value]
          o.material.needsUpdate = true
        }
      })
    })

    this.model.on("change:pointSize", (model, value) => {
      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.userData.shader.uniforms.uPointSize.value = value
        }
      })
    })

    this.model.on("change:preserveDrawingBuffer", () => {
      this.updateRenderer()
    })

    this.model.on("change:planeOpacity", (model, value) => {
      this.backgroundPlane.material.opacity = value
    })

    this.model.on("change:background", (model, value) => {
      const material = this.backgroundPlane.material
      material.color = this.getColor(value)
      material.needsUpdate = true
    })

    this.model.on("change:backgroundTexture", (model, value) => {
      this.renderer.clear(true, false, false)
      const material = this.backgroundPlane.material

      if (value === "None") {
        material.map = null
      } else if (value === "default") {
        material.map = new TextureLoader().load(defaultBackgroundImage)
      } else {
        material.map = new TextureLoader().load(`textures/${value}`)
      }

      material.needsUpdate = true
    })
  }

  updateRenderer() {
    if (this.renderer) {
      document.body.removeChild(this.renderer.domElement)
    }

    this.renderer = this.createRenderer()

    document.body.appendChild(this.renderer.domElement)

    this.updateMouseControls()
  }

  updateMouseControls() {
    if (this.mouseControls) {
      this.mouseControls.removeEventHandlers()
    }

    this.mouseControls = new MouseControls(this.renderer.domElement, (deltaQuaternion) => {
      this.object3D.quaternion.multiplyQuaternions(deltaQuaternion, this.object3D.quaternion)
    })
  }

  createRenderer() {
    const preserveDrawingBuffer = this.model.attributes.preserveDrawingBuffer

    const renderer = new WebGLRenderer({
      preserveDrawingBuffer,
      antialias: false,
      alpha: true
    })

    renderer.autoClear = true
    renderer.autoClearDepth = true
    renderer.autoClearSencil = true
    renderer.autoClearColor = false

    renderer.sortObjects = false

    renderer.getContext().getExtension("OES_standard_derivatives")
    renderer.setClearColor(0xffffff, 1)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(2)

    return renderer
  }

  loadNoiseTexture() {
    this.loadTexture(defaultNoiseImage, "uNoiseTexture")
  }

  loadColorTexture() {
    const { colorTexture } = this.model.attributes

    const path = colorTexture === "None" ? defaultNoiseImage :
      `textures/${colorTexture}`

    this.loadTexture(path, "uColorTexture")
  }

  loadTexture(filePath, uniformName) {
    new TextureLoader().load(filePath, (texture) => {
      texture.wrapT = texture.wrapS = RepeatWrapping

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          o.material.userData.shader.uniforms[uniformName].value = texture
        }
      })
    })
  }

  createPerspectiveCamera() {
    const { cameraPosZ, zoom } = this.model.attributes

    const aspect = window.innerWidth / window.innerHeight
    const camera = new PerspectiveCamera(75, aspect, 0.01, 1000)
    camera.position.z = cameraPosZ
    camera.lookAt(new Vector3(0, 0, 0))
    camera.zoom = zoom
    camera.updateProjectionMatrix()

    return camera
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  createLights() {
    const lights = {}

    lights.directionalLightX = new DirectionalLight(0xffffff, 0.5)
    lights.directionalLightX.name = "directionalLightX"
    lights.directionalLightX.position.set(1.0, 0.0, 0.0)
    lights.directionalLightX.visible = this.model.attributes.directionalLightX

    lights.directionalLightY = new DirectionalLight(0xffffff, 0.5)
    lights.directionalLightY.name = "directionalLightY"
    lights.directionalLightY.position.set(0.0, 1.0, 0.0)
    lights.directionalLightY.visible = this.model.attributes.directionalLightY

    lights.directionalLightZ = new DirectionalLight(0xffffff, 0.5)
    lights.directionalLightZ.name = "directionalLightZ"
    lights.directionalLightZ.position.set(0.0, 0.0, 1.0)
    lights.directionalLightZ.visible = this.model.attributes.directionalLightZ

    lights.pointLight1 = new PointLight(0xffffff, 0.5, 1000)
    lights.pointLight1.name = "pointLight1"
    lights.pointLight1.position.set(1.0, 1.0, 1.0)
    lights.pointLight1.visible = this.model.attributes.pointLight1

    lights.pointLight2 = new PointLight(0xffffff, 0.5, 1000)
    lights.pointLight2.name = "pointLight2"
    lights.pointLight2.position.set(-1.0, 1.0, 1.0)
    lights.pointLight2.visible = this.model.attributes.pointLight2

    return lights
  }

  createObject3D(geometry, material) {
    const attributes = this.model.attributes

    const object3D = attributes.object3d === "THREE.Points" ?
        new Points(geometry, material) :
        new Mesh(geometry, material)

    object3D.rotation.x = attributes.rotationX
    object3D.rotation.y = attributes.rotationY
    object3D.rotation.z = attributes.rotationZ

    return object3D
  }

  createGeometry() {
    const { geometry, segmentsX, segmentsY } = this.model.attributes

    if (geometry === "THREE.SphereGeometry") {
      return new SphereGeometry(1.0, segmentsX, segmentsY)
    } else if (geometry === "THREE.BoxGeometry") {
      return new BoxGeometry(1.0, 1.0, 1.0, segmentsX, segmentsX, segmentsX)
    } else if (geometry === "THREE.TorusKnotGeometry") {
      return new TorusKnotGeometry(1.0, 0.3, segmentsX, segmentsY)
    } else if (geometry === "THREE.PlaneGeometry") {
      return new PlaneGeometry(1.0, 1.0, segmentsX, segmentsY)
    }
  }

  createShaderMaterial() {
    const attributes = this.model.attributes
    const { r, g, b } = this.getColor(attributes.ambientLight)

    return new ShaderMaterial({
      side: DoubleSide,
      transparent: true,
      blending: THREE[attributes.blending],
      wireframe: attributes.wireframe,
      wireframeLinewidth: attributes.lineWidth,
      depthTest: attributes.depthTest,
      lights: true,
      derivatives: true,
      vertexShader,
      fragmentShader,
      uniforms: UniformsUtils.merge([
        UniformsLib.lights,
        {
          uStep: { type: "f", value: this.step },
          uScale: { type: "f", value: attributes.scale },
          uMorph: { type: "i", value: 0 },
          uMorphStep: { type: "f", value: this.morphStep },
          uNoiseTexture: { type: "t" },
          uColorTexture: { type: "t" },
          // uOpacity: { type: "f", value: attributes.opacity },
          uAmbientLight: {
            type: "v3", value: new Vector3(r, g, b)
          },
          uPointSize: { type: "f", value: attributes.pointSize }
        }
      ])
    })
  }

  createBackgroundPlane() {
    const { background, backgroundTexture, planeOpacity } = this.model.attributes
    const geometry = new PlaneGeometry(2, 2)

    const { r, g, b } = this.getColor(background)
    const material = new MeshBasicMaterial({
      transparent: true,
      opacity: planeOpacity,
      color: new Color(r, g, b)
    })

    const backgroundPlane = new Mesh(geometry, material)

    if (backgroundTexture === "default") {
      backgroundPlane.material.map =  new TextureLoader().load(defaultBackgroundImage)
    } else {
      backgroundPlane.material.map = new TextureLoader().load(`textures/${backgroundTexture}`)
    }

    backgroundPlane.material.depthTest = false
    backgroundPlane.material.depthWrite = false

    return backgroundPlane
  }

  getColor(value) {
    if (typeof value === "string") {
      return new Color(value)
    } else {
      return new Color(value[0] / 255, value[1] / 255, value[2] / 255)
    }
  }

  render() {
    this.clock.start()
    this.animate()
  }

  animate() {
    if (this.statsVisible) {
      this.stats.update()
    }

    requestAnimationFrame(this.animate.bind(this))

    const deltaTime = this.clock.getDelta()

    this.updateStep(deltaTime)
    this.updateMorphStep(deltaTime)
    this.updateRotation(deltaTime)

    this.renderer.render(this.backgroundScene, this.backgroundCamera)
    this.renderer.render(this.scene, this.camera)
  }

  updateStep(deltaTime) {
    const { pause, speed } = this.model.attributes

    this.object3D.traverse((o) => {
      if (o.isMesh) {
        if (!pause) {
          this.step += deltaTime * speed * 0.01

          const shader = o.material.userData.shader;
          if (shader) {
            shader.uniforms.uStep.value = this.step
          }
        }
      }
    })
  }

  updateMorphStep(deltaTime) {
    const { morph, morphStep, pause, speed } = this.model.attributes

    const factor = {
      off: 0,
      forwards: 1,
      backwards: -1
    }[morph]

    const newMorphStep = clamp(morphStep + factor * deltaTime * speed * 0.01, 0, 1)

    if (newMorphStep === 1) {
      this.model.set({ morph: "backwards" })
    } else if (newMorphStep === 0) {
      this.model.set({ morph: "forwards" })
    }

    if (!pause) {
      this.model.set({ morphStep: newMorphStep })

      this.object3D.traverse((o) => {
        if (o.isMesh) {
          if (!pause) {
            const shader = o.material.userData.shader;
            if (shader) {
              shader.uniforms.uMorphStep.value = newMorphStep
            }
          }
        }
      })
    }
  }

  updateRotation(deltaTime) {
    const { pause, rotationSpeedX, rotationSpeedY, rotationSpeedZ } = this.model.attributes
    const objectRotation = this.object3D.rotation

    if (!pause) {
      objectRotation.x += rotationSpeedX * deltaTime
      objectRotation.y += rotationSpeedY * deltaTime
      objectRotation.z += rotationSpeedZ * deltaTime
    }

    this.model.set({ rotationX: objectRotation.x })
    this.model.set({ rotationY: objectRotation.y })
    this.model.set({ rotationZ: objectRotation.z })
  }

  showStats() {
    this.stats.domElement.style.position = "absolute"
    this.stats.domElement.style.left = "0px"
    this.stats.domElement.style.top = "0px"
    document.body.appendChild(this.stats.domElement)

    this.statsVisible = true
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
