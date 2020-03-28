(ns jarvis.com.client
  (:require [clojure.java.io :as io])
  (:import [java.net Socket]))

(defn send-msg
  ([content]
   (send-msg (Integer/parseInt (slurp "/tmp/jarvis.port")) content))
  ([port content]
   (let [socket (Socket. "localhost" port)
         out (.getOutputStream socket)]
     (spit out content))))

(comment
  (send-msg "test"))

