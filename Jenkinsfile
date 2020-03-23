pipeline {
    environment {
        image = 'yassinelaz/express-demo'
        registry = 'registry.local'
        registryUrl = 'http://registry.local'
        registryCredential = 'gitlabregistry'
        sonarqube = tool name: 'SonarScanner'
    }
    agent any
    stages {
        stage('Clone from source') {
            steps {
                script {
                    git branch: 'master',
                    credentialsId: 'jenkins',
                    url: 'ssh://git@gitlab:22/yassinelaz/express-demo.git'
                }
            }
        }
        stage("SonarQube analysis") {
            steps {
                withSonarQubeEnv('Sonarqube') {
                    sh "${sonarqube}/bin/sonar-scanner"
                }
            }
        }   
        stage("SonarQube quality gate") {
            steps {
                script {
                    sleep(10)
                    timeout(time: 1, unit: 'HOURS') { // Just in case something goes wrong, pipeline will be killed after a timeout
                        qg = waitForQualityGate() // Reuse taskId previously collected by withSonarQubeEnv
                        if (qg.status != 'OK') {
                          error "Pipeline aborted due to quality gate failure: ${qg.status}"
                        }
                    }
                }
            }
        }
        stage('Build and start image') {
            steps {
                script {
                    packageJSON = readJSON file: 'package.json'
                    packageJSONVersion = packageJSON.version
                    echo packageJSONVersion
                    docker.build registry + '/' + image + ':' + packageJSONVersion
                    docker.build registry + '/' + image + ':latest'
                    sh "REGISTRY=${registry} TAG=${packageJSONVersion} docker-compose up -d" // Unecessary to run the tests
                }
            }
        }
        stage('Test image') {
            steps {
                script {
                    sh "docker exec express npm run test"
                }
            }
        }
        stage('Push image') {
            steps {
                script {
                    withCredentials([usernamePassword( credentialsId: registryCredential, usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        docker.withRegistry(registryUrl, registryCredential) {
                            sh "docker login -u ${USERNAME} -p ${PASSWORD}"
                            sh "docker push ${registry}/${image}:${packageJSONVersion}" 
                            sh "docker push ${registry}/${image}:latest" 
                        }
                    }
                }
            }
        }
        stage('Run staging') {
            steps {
                script {
                    sh "REGISTRY=${registry} TAG=${packageJSONVersion} docker-compose -f ./docker-compose-stage.yml up -d"
                    notifyStarted("Successful build awaiting QA approval", packageJSONVersion)
                }
            }
        }
        stage('Approve prod deployment for this build?') {
            steps {
                script {
                    if (currentBuild.result == null || currentBuild.result == 'SUCCESS') {
                        timeout(time: 3, unit: 'MINUTES') {
                            input message:'Approve deployment?', submitter: 'qa-001'
                        }
                    }
                }
            }
        }
        stage('Run production') {
            steps {
                script {
                    sh "REGISTRY=${registry} TAG=${packageJSONVersion} docker-compose -f ./docker-compose-prod.yml up -d"
                    notifyStarted("Build approved and deployed to production", packageJSONVersion)
                }
            }
        }
    }
}

def notifyStarted(String message, String version) {
  slackSend (color: '#FFFF00', message: "${message}: Job '${env.JOB_NAME} [User: ${env.BUILD_USER_ID}] [Build: ${env.BUILD_NUMBER}] [project: ${env.JOB_BASE_NAME}][version: $version]' (${env.BUILD_URL})")
}